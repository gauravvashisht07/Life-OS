const router   = require('express').Router()
const auth      = require('../middleware/auth')
const Finance   = require('../models/Finance')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// ─── All existing finance routes ─────────────────────────────────────────────

router.get('/', auth, async (req, res) => {
  try {
    const records = await Finance.find({ user: req.user.id }).sort({ date: -1 })
    res.json(records)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
  try {
    const record = await Finance.create({ ...req.body, user: req.user.id })
    res.status(201).json(record)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await Finance.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/summary', auth, async (req, res) => {
  try {
    const records    = await Finance.find({ user: req.user.id })
    const income     = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expenses   = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    const byCategory = {}
    records.forEach(r => {
      if (!byCategory[r.category]) byCategory[r.category] = { income: 0, expense: 0 }
      byCategory[r.category][r.type] += r.amount
    })
    res.json({ income, expenses, balance: income - expenses, byCategory })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── AI Insights Route ────────────────────────────────────────────────────────

router.post('/ai-analyze', auth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ message: 'GEMINI_API_KEY not configured on server.' })
    }

    // Fetch last 90 days of records
    const since   = new Date(); since.setDate(since.getDate() - 90)
    const records = await Finance.find({
      user: req.user.id,
      date: { $gte: since.toISOString().split('T')[0] }
    }).sort({ date: -1 })

    if (records.length === 0) {
      return res.json({ insight: 'No recent transactions found (last 90 days). Add some income and expense records first!' })
    }

    // Build a compact summary for the prompt
    const income   = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expenses = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

    const byCategory = {}
    records.filter(r => r.type === 'expense').forEach(r => {
      byCategory[r.category] = (byCategory[r.category] || 0) + r.amount
    })

    // Group by month
    const byMonth = {}
    records.forEach(r => {
      const m = r.date.slice(0, 7)
      if (!byMonth[m]) byMonth[m] = { income: 0, expenses: 0 }
      byMonth[m][r.type === 'income' ? 'income' : 'expenses'] += r.amount
    })

    // Recent transactions (last 20)
    const recentList = records.slice(0, 20).map(r =>
      `${r.date} | ${r.type === 'income' ? '+' : '-'}₹${r.amount} | ${r.category} | ${r.title}`
    ).join('\n')

    const prompt = `
You are a personal finance advisor. Analyze the following financial data (last 90 days) and provide a concise, helpful, and honest analysis.

## Summary
- Total Income: ₹${income.toLocaleString()}
- Total Expenses: ₹${expenses.toLocaleString()}
- Net Savings: ₹${(income - expenses).toLocaleString()}
- Savings Rate: ${income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%

## Expenses by Category
${Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) =>
  `- ${cat}: ₹${amt.toLocaleString()} (${income > 0 ? Math.round((amt / income) * 100) : 0}% of income)`
).join('\n')}

## Monthly Breakdown
${Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, d]) =>
  `- ${month}: Income ₹${d.income.toLocaleString()}, Expenses ₹${d.expenses.toLocaleString()}`
).join('\n')}

## Recent Transactions (last 20)
${recentList}

Please provide:
1. 🚨 **Top 2-3 areas where money is being wasted** (be specific with amounts)
2. 📊 **Spending pattern observations** (trends, spikes, comparisons)
3. 💡 **3 actionable tips** to save more money based on this data
4. ✅ **One thing being done well**

Keep the response concise, friendly, and use Indian Rupee (₹). Format with emoji and markdown bold for headings. Max 300 words.
`

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const insight = result.response.text()

    res.json({ insight, recordsAnalyzed: records.length, period: '90 days' })

  } catch (err) {
    console.error('Gemini error:', err.message)
    res.status(500).json({ message: 'AI analysis failed: ' + err.message })
  }
})

module.exports = router
