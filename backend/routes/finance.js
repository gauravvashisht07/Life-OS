const router = require('express').Router()
const auth = require('../middleware/auth')
const { finance } = require('../db/db')

router.get('/', auth, async (req, res) => {
    try {
        const all = await finance.find({ userId: req.user.id })
        res.json(all.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
    try {
        const record = await finance.insert({ ...req.body, userId: req.user.id, createdAt: new Date().toISOString() })
        res.status(201).json(record)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
    try {
        await finance.update({ _id: req.params.id, userId: req.user.id }, { $set: req.body })
        res.json(await finance.findOne({ _id: req.params.id }))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        await finance.remove({ _id: req.params.id, userId: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/summary', auth, async (req, res) => {
    try {
        const all = await finance.find({ userId: req.user.id })
        const income = all.filter(r => r.type === 'income').reduce((s, r) => s + (r.amount || 0), 0)
        const expenses = all.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amount || 0), 0)
        const byCategory = {}
        all.forEach(r => {
            if (!byCategory[r.category]) byCategory[r.category] = { income: 0, expense: 0 }
            byCategory[r.category][r.type] = (byCategory[r.category][r.type] || 0) + (r.amount || 0)
        })
        res.json({ income, expenses, balance: income - expenses, byCategory })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
