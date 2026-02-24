import { useState, useEffect } from 'react'
import axios from '../api'
import toast from 'react-hot-toast'

const ICONS = ['💪', '📖', '🧘', '🏃', '💧', '🥗', '😴', '🎵', '✍️', '🌅']
const COLORS = ['#89b4fa', '#cba6f7', '#a6e3a1', '#f38ba8', '#94e2d5', '#f9e2af', '#fab387', '#f5c2e7']

function HeatmapCell({ date, completed }) {
    return <div className={`heat-cell${completed ? ' active' : ''}`} title={date} />
}

function HabitCard({ habit, onCheckin, onDelete }) {
    const today = new Date().toISOString().split('T')[0]
    const doneToday = habit.checkIns?.some(c => c.date === today)

    // Build last 30 days
    const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i))
        const str = d.toISOString().split('T')[0]
        return { date: str, completed: habit.checkIns?.some(c => c.date === str) }
    })

    return (
        <div className="card" style={{ borderLeft: `3px solid ${habit.color || '#89b4fa'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{habit.icon || '⭐'}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{habit.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{habit.frequency}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="streak-badge">🔥 {habit.streak}</span>
                    <button className="btn-icon" onClick={() => onDelete(habit._id)} title="Delete">🗑️</button>
                </div>
            </div>

            <div className="heatmap" style={{ marginBottom: '12px' }}>
                {last30.map(c => <HeatmapCell key={c.date} {...c} />)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best: 🔥 {habit.longestStreak} days</span>
                <button
                    className={`btn btn-sm ${doneToday ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => !doneToday && onCheckin(habit._id)}
                    disabled={doneToday}
                >
                    {doneToday ? '✅ Done Today' : '✔ Check In (+10 XP)'}
                </button>
            </div>
        </div>
    )
}

export default function Habits() {
    const [habits, setHabits] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', icon: '💪', color: '#89b4fa', frequency: 'daily' })
    const [loading, setLoading] = useState(true)

    const fetchHabits = () => {
        axios.get('/api/habits').then(r => setHabits(r.data)).catch(console.error).finally(() => setLoading(false))
    }
    useEffect(() => { fetchHabits() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            await axios.post('/api/habits', form)
            toast.success('Habit created! 💪')
            setShowModal(false)
            setForm({ name: '', icon: '💪', color: '#89b4fa', frequency: 'daily' })
            fetchHabits()
        } catch { toast.error('Failed to create habit') }
    }

    const handleCheckin = async (id) => {
        try {
            const { data } = await axios.post(`/api/habits/${id}/checkin`)
            toast.success(`🔥 Streak: ${data.streak} days! +10 XP`)
            setHabits(prev => prev.map(h => h._id === id ? data : h))
        } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    }

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/habits/${id}`)
            toast.success('Habit removed')
            setHabits(prev => prev.filter(h => h._id !== id))
        } catch { toast.error('Failed to delete') }
    }

    const doneCount = habits.filter(h => h.checkIns?.some(c => c.date === new Date().toISOString().split('T')[0])).length

    return (
        <div className="page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>🔥 Habit Tracker</h2>
                    <p>Build consistency, one day at a time</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Habit</button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value" style={{ color: 'var(--accent)' }}>{habits.length}</div><div className="stat-label">Total Habits</div></div>
                <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value" style={{ color: 'var(--green)' }}>{doneCount}</div><div className="stat-label">Done Today</div></div>
                <div className="stat-card"><div className="stat-icon">🔥</div><div className="stat-value" style={{ color: 'var(--orange)' }}>{Math.max(...habits.map(h => h.streak), 0)}</div><div className="stat-label">Best Streak</div></div>
                <div className="stat-card"><div className="stat-icon">🏆</div><div className="stat-value" style={{ color: 'var(--yellow)' }}>{Math.max(...habits.map(h => h.longestStreak), 0)}</div><div className="stat-label">All-Time Best</div></div>
            </div>

            {loading ? <div className="loading"><div className="spinner" /></div> :
                habits.length === 0 ? (
                    <div className="empty-state"><div className="emoji">🌱</div><h3>No habits yet</h3><p>Create your first habit to get started!</p></div>
                ) : (
                    <div className="grid-auto">
                        {habits.map(h => <HabitCard key={h._id} habit={h} onCheckin={handleCheckin} onDelete={handleDelete} />)}
                    </div>
                )
            }

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header">
                            <h3>✨ New Habit</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Habit Name</label>
                                <input className="form-control" placeholder="e.g. Morning Exercise" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Icon</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ICONS.map(ic => (
                                        <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                                            style={{ fontSize: '1.4rem', padding: '6px', border: `2px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer' }}>
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {COLORS.map(c => (
                                        <div key={c} onClick={() => setForm({ ...form, color: c })}
                                            style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${form.color === c ? 'white' : 'transparent'}`, transition: 'all 0.2s' }} />
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Frequency</label>
                                <select className="form-control" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Create Habit 💪</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
