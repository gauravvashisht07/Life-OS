import { useState, useEffect, useMemo } from 'react'
import axios from '../api'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Modal from '../components/Modal'

const EXPENSE_CATS = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Bills', 'Other']
const INCOME_CATS  = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
const PIE_COLORS   = ['#89b4fa', '#cba6f7', '#a6e3a1', '#f38ba8', '#94e2d5', '#f9e2af', '#fab387', '#f5c2e7']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Finance() {
  const [records,   setRecords]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')        // all | income | expense
  const [monthFilter, setMonthFilter] = useState('all')      // all | YYYY-MM
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'Food', date: new Date().toISOString().split('T')[0], note: '' })
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const res = await axios.get('/api/finance')
    setRecords(res.data); setLoading(false)
  }
  useEffect(() => { fetchData().catch(console.error) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/finance', { ...form, amount: Number(form.amount) })
      toast.success(`💰 ${form.type === 'income' ? 'Income' : 'Expense'} added!`)
      setShowModal(false); fetchData()
    } catch { toast.error('Failed to add record') }
  }

  const handleDelete = async (id) => {
    try { await axios.delete(`/api/finance/${id}`); toast.success('Record deleted'); fetchData() }
    catch { toast.error('Failed to delete') }
  }

  // Derive available months from records (sorted newest first)
  const availableMonths = useMemo(() => {
    const set = new Set(records.map(r => r.date?.slice(0, 7)).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [records])

  // Apply both filters
  const filtered = useMemo(() => records.filter(r => {
    const matchType  = typeFilter  === 'all' || r.type === typeFilter
    const matchMonth = monthFilter === 'all' || r.date?.startsWith(monthFilter)
    return matchType && matchMonth
  }), [records, typeFilter, monthFilter])

  // Compute summary from filtered records
  const summary = useMemo(() => {
    const income   = filtered.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expenses = filtered.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    return { income, expenses, balance: income - expenses }
  }, [filtered])

  // Pie chart from filtered expense records
  const pieData = useMemo(() => {
    const bycat = {}
    filtered.filter(r => r.type === 'expense').forEach(r => { bycat[r.category] = (bycat[r.category] || 0) + r.amount })
    return Object.entries(bycat).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const fmtMonth = (ym) => {
    const [y, m] = ym.split('-')
    return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`
  }

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>💰 Finance Tracker</h2>
          <p>Income, expenses &amp; budget overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Record</button>
      </div>

      {/* Summary Cards — reflect selected month */}
      <div className="finance-header">
        <div className="finance-summary-card income">
          <div className="finance-amount" style={{ color: 'var(--green)' }}>₹{summary.income.toLocaleString()}</div>
          <div className="finance-label">💚 {monthFilter === 'all' ? 'Total' : fmtMonth(monthFilter)} Income</div>
        </div>
        <div className="finance-summary-card expense">
          <div className="finance-amount" style={{ color: 'var(--red)' }}>₹{summary.expenses.toLocaleString()}</div>
          <div className="finance-label">❤️ {monthFilter === 'all' ? 'Total' : fmtMonth(monthFilter)} Expenses</div>
        </div>
        <div className="finance-summary-card balance">
          <div className="finance-amount" style={{ color: summary.balance >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            ₹{summary.balance.toLocaleString()}
          </div>
          <div className="finance-label">💙 Net Balance</div>
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>
            📊 Expense Breakdown {monthFilter !== 'all' && <span style={{ color: 'var(--accent)', fontWeight: 400 }}>— {fmtMonth(monthFilter)}</span>}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: '#1e1e2e', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{d.name}: ₹{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar: type buttons + month dropdown */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Type filter */}
        {['all', 'income', 'expense'].map(f => (
          <button key={f} className={`btn btn-sm ${typeFilter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}

        <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Month filter */}
        <select className="form-control" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="all">📅 All Months</option>
          {availableMonths.map(ym => (
            <option key={ym} value={ym}>{fmtMonth(ym)}</option>
          ))}
        </select>

        {/* Active filter pill */}
        {monthFilter !== 'all' && (
          <button className="btn btn-sm btn-secondary" onClick={() => setMonthFilter('all')}>✕ {fmtMonth(monthFilter)}</button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Records Table */}
      <div className="card">
        {loading ? <div className="loading"><div className="spinner" /></div> :
          filtered.length === 0 ? (
            <div className="empty-state"><div className="emoji">💳</div><h3>No records</h3><p>{monthFilter !== 'all' ? `No transactions in ${fmtMonth(monthFilter)}` : 'Add your first transaction!'}</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Date</th><th>Amount</th><th /></tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td>{r.title}{r.note && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{r.note}</span>}</td>
                      <td><span className={`badge ${r.type === 'income' ? 'badge-green' : 'badge-red'}`}>{r.category}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.date}</td>
                      <td style={{ fontWeight: 700, color: r.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                        {r.type === 'income' ? '+' : '-'}₹{r.amount.toLocaleString()}
                      </td>
                      <td><button className="btn-icon" onClick={() => handleDelete(r._id)}>🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Add Transaction Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="modal-header"><h3>💰 Add Transaction</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['expense', 'income'].map(t => (
              <button key={t} type="button" className={`btn btn-sm ${form.type === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                onClick={() => setForm({ ...form, type: t, category: t === 'expense' ? 'Food' : 'Salary' })}>{t}</button>
            ))}
          </div>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" placeholder="e.g. Grocery shopping" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" min="1" className="form-control" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {(form.type === 'expense' ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input className="form-control" placeholder="..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {form.type === 'income' ? '💚 Add Income' : '❤️ Add Expense'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
