import { useState, useEffect } from 'react'
import axios from '../api'
import toast from 'react-hot-toast'

const CATEGORIES = ['Career', 'Health', 'Education', 'Finance', 'Personal', 'Creative', 'Relationships']
const TYPE_CONFIG = {
    short: { label: 'Short-Term', emoji: '⚡', color: 'var(--green)', desc: '< 1 month', badge: 'badge-green' },
    mid: { label: 'Mid-Term', emoji: '🎯', color: 'var(--accent)', desc: '1–6 months', badge: 'badge-blue' },
    long: { label: 'Long-Term', emoji: '🏆', color: 'var(--purple)', desc: '6+ months', badge: 'badge-purple' },
}

function GoalCard({ goal, onUpdate, onDelete }) {
    const cfg = TYPE_CONFIG[goal.type]
    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null
    const overdue = daysLeft !== null && daysLeft < 0

    return (
        <div className="goal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h4>{goal.title}</h4>
                <button className="btn-icon" style={{ fontSize: '0.8rem', padding: '2px 6px' }} onClick={() => onDelete(goal._id)}>🗑️</button>
            </div>
            {goal.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{goal.description}</p>}

            <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Progress</span><span>{goal.progress}%</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${goal.progress}%`, background: cfg.color }} />
                </div>
            </div>

            <input type="range" min="0" max="100" value={goal.progress}
                onChange={e => onUpdate(goal._id, { progress: Number(e.target.value) })}
                style={{ width: '100%', accentColor: cfg.color, marginBottom: '8px', cursor: 'pointer' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${cfg.badge}`}>{goal.category}</span>
                {goal.deadline && (
                    <div className="deadline" style={{ color: overdue ? 'var(--red)' : 'var(--text-muted)' }}>
                        📅 {overdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </div>
                )}
            </div>

            {goal.status !== 'completed' && (
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '10px', justifyContent: 'center' }}
                    onClick={() => onUpdate(goal._id, { status: 'completed', progress: 100 })}>
                    ✅ Mark Complete
                </button>
            )}
        </div>
    )
}

export default function Goals() {
    const [goals, setGoals] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [filter, setFilter] = useState('active')
    const [form, setForm] = useState({ title: '', description: '', type: 'short', category: 'Personal', deadline: '' })
    const [loading, setLoading] = useState(true)

    const fetchGoals = () => {
        axios.get('/api/goals').then(r => setGoals(r.data)).catch(console.error).finally(() => setLoading(false))
    }
    useEffect(() => { fetchGoals() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            await axios.post('/api/goals', form)
            toast.success('Goal created! 🎯')
            setShowModal(false); setForm({ title: '', description: '', type: 'short', category: 'Personal', deadline: '' })
            fetchGoals()
        } catch { toast.error('Failed to create goal') }
    }

    const handleUpdate = async (id, data) => {
        try {
            const { data: updated } = await axios.put(`/api/goals/${id}`, data)
            if (data.status === 'completed') toast.success('🏆 Goal completed! XP awarded!')
            setGoals(prev => prev.map(g => g._id === id ? updated : g))
        } catch { toast.error('Update failed') }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/goals/${id}`)
            toast.success('Goal deleted')
            setGoals(prev => prev.filter(g => g._id !== id))
        } catch { toast.error('Failed to delete') }
    }

    const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter)
    const byType = type => filtered.filter(g => g.type === type)

    return (
        <div className="page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>🎯 Goal Manager</h2>
                    <p>Short, mid, and long-term goal tracking</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Goal</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {['active', 'completed', 'all'].map(f => (
                    <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
                ))}
            </div>

            {loading ? <div className="loading"><div className="spinner" /></div> : (
                <div className="kanban">
                    {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                        <div key={type} className="kanban-col">
                            <div className="kanban-col-header">
                                <span>{cfg.emoji}</span>
                                <span style={{ color: cfg.color }}>{cfg.label}</span>
                                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{byType(type).length}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{cfg.desc}</div>
                            {byType(type).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>No {cfg.label.toLowerCase()} goals</div>
                            ) : byType(type).map(g => <GoalCard key={g._id} goal={g} onUpdate={handleUpdate} onDelete={handleDelete} />)}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>🎯 New Goal</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Goal Title</label>
                                <input className="form-control" placeholder="What do you want to achieve?" value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" placeholder="Why is this goal important?" value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="short">⚡ Short-Term (&lt;1mo)</option>
                                        <option value="mid">🎯 Mid-Term (1–6mo)</option>
                                        <option value="long">🏆 Long-Term (6mo+)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Deadline (optional)</label>
                                <input type="date" className="form-control" value={form.deadline}
                                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Create Goal 🎯</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
