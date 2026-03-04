import { useState, useEffect, useRef } from 'react'
import axios from '../api'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const CATEGORIES = ['Study', 'Coding', 'Health', 'Personal', 'Work', 'Other']
const PRIORITIES = ['high', 'medium', 'low']
const STATUSES = ['pending', 'in-progress', 'completed', 'skipped']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' }
const PRIORITY_ICON = { high: '🔴', medium: '🟡', low: '🟢' }
const STATUS_ICON = { pending: '⬜', 'in-progress': '🔵', completed: '✅', skipped: '⏭️' }
const CAT_ICON = { Study: '📚', Coding: '💻', Health: '🏃', Personal: '👤', Work: '💼', Other: '📌' }

const tooltipStyle = { background: '#1e1e2e', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }

function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
    return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`
}

const blank = { title: '', description: '', category: 'Personal', priority: 'medium', status: 'pending', deadline: '', notes: '', todaysFocus: false, isRecurring: false, recurringDays: [], subtasks: [] }

export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [stats, setStats] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [form, setForm] = useState(blank)
    const [subtaskInput, setSubtaskInput] = useState('')
    const [filter, setFilter] = useState({ status: '', category: '', priority: '' })
    const [view, setView] = useState('tasks') // tasks | analytics
    const [activeTimer, setActiveTimer] = useState(null) // taskId
    const [timerSec, setTimerSec] = useState(0)
    const [dragId, setDragId] = useState(null)
    const timerRef = useRef(null)

    const fetchAll = async () => {
        const [t, s] = await Promise.all([axios.get('/api/tasks'), axios.get('/api/tasks/stats')])
        setTasks(t.data); setStats(s.data)
    }
    useEffect(() => { fetchAll().catch(console.error) }, [])

    // Timer logic
    useEffect(() => {
        if (activeTimer) {
            timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
        } else {
            clearInterval(timerRef.current)
        }
        return () => clearInterval(timerRef.current)
    }, [activeTimer])

    const startTimer = (id) => { setActiveTimer(id); setTimerSec(0) }
    const stopTimer = async () => {
        clearInterval(timerRef.current)
        if (timerSec > 0) {
            await axios.patch(`/api/tasks/${activeTimer}/timer`, { seconds: timerSec })
            toast.success(`⏱️ +${fmtTime(timerSec)} logged`)
            fetchAll()
        }
        setActiveTimer(null); setTimerSec(0)
    }

    const openCreate = () => { setForm(blank); setEditTask(null); setSubtaskInput(''); setShowModal(true) }
    const openEdit = (t) => {
        setForm({ ...t, recurringDays: t.recurringDays || [], subtasks: t.subtasks || [] })
        setEditTask(t._id); setSubtaskInput(''); setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editTask) { await axios.put(`/api/tasks/${editTask}`, form) }
            else { await axios.post('/api/tasks', form) }
            toast.success(editTask ? '✏️ Task updated!' : '✅ Task created!')
            setShowModal(false); fetchAll()
        } catch { toast.error('Failed to save task') }
    }

    const setStatus = async (id, status) => {
        await axios.put(`/api/tasks/${id}`, { status })
        fetchAll()
    }

    const toggleFocus = async (t) => {
        await axios.put(`/api/tasks/${t._id}`, { todaysFocus: !t.todaysFocus })
        fetchAll()
    }

    const deleteTask = async (id) => {
        await axios.delete(`/api/tasks/${id}`)
        toast.success('🗑️ Deleted'); fetchAll()
    }

    const toggleSubtask = async (task, idx) => {
        const subtasks = task.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
        await axios.put(`/api/tasks/${task._id}`, { subtasks }); fetchAll()
    }

    const addSubtask = () => {
        if (!subtaskInput.trim()) return
        setForm(f => ({ ...f, subtasks: [...(f.subtasks || []), { title: subtaskInput.trim(), done: false }] }))
        setSubtaskInput('')
    }
    const removeSubtask = (idx) => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, i) => i !== idx) }))

    // Drag-and-drop
    const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }
    const onDrop = async (e, targetId) => {
        e.preventDefault()
        if (dragId === targetId) return
        const ids = tasks.map(t => t._id)
        const from = ids.indexOf(dragId), to = ids.indexOf(targetId)
        const reordered = [...ids]
        reordered.splice(from, 1); reordered.splice(to, 0, dragId)
        const newTasks = reordered.map(id => tasks.find(t => t._id === id))
        setTasks(newTasks)
        await axios.patch('/api/tasks/reorder', { orderedIds: reordered })
        setDragId(null)
    }

    const filtered = tasks.filter(t =>
        (!filter.status || t.status === filter.status) &&
        (!filter.category || t.category === filter.category) &&
        (!filter.priority || t.priority === filter.priority)
    )
    const focusTasks = tasks.filter(t => t.todaysFocus && t.status !== 'completed')
    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="page fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>✅ Daily Tasks</h2>
                    <p>Manage your tasks, focus, and productivity</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${view === 'tasks' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('tasks')}>📋 Tasks</button>
                    <button className={`btn btn-sm ${view === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('analytics')}>📊 Analytics</button>
                    <button className="btn btn-primary" onClick={openCreate}>+ New Task</button>
                </div>
            </div>

            {/* Active Timer Banner */}
            {activeTimer && (
                <div className="card" style={{ background: 'rgba(137,180,250,0.1)', border: '1px solid var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>Timer running</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{fmtTime(timerSec)}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={stopTimer}>⏹ Stop & Save</button>
                </div>
            )}

            {view === 'tasks' && (
                <>
                    {/* Today's Focus */}
                    {focusTasks.length > 0 && (
                        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(249,226,175,0.3)', background: 'rgba(249,226,175,0.05)' }}>
                            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', marginBottom: '12px', color: 'var(--yellow)' }}>⭐ Today's Focus</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {focusTasks.map(t => (
                                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(49,50,68,0.5)', borderRadius: '8px' }}>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setStatus(t._id, t.status === 'completed' ? 'pending' : 'completed')}>
                                            {STATUS_ICON[t.status]}
                                        </button>
                                        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text)' }}>{t.title}</span>
                                        <span className="badge badge-yellow">{CAT_ICON[t.category]} {t.category}</span>
                                        {PRIORITY_ICON[t.priority]}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <select className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                            value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                            <option value="">All Status</option>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                        </select>
                        <select className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                            value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
                            <option value="">All Categories</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                        </select>
                        <select className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                            value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
                            <option value="">All Priorities</option>
                            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_ICON[p]} {p}</option>)}
                        </select>
                        {(filter.status || filter.category || filter.priority) && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setFilter({ status: '', category: '', priority: '' })}>✕ Clear</button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Task List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.length === 0 ? (
                            <div className="card empty-state"><div className="emoji">📋</div><h3>No tasks yet</h3><p>Create your first task to get started!</p></div>
                        ) : filtered.map(task => {
                            const isOverdue = task.deadline && task.deadline < today && task.status !== 'completed'
                            const doneSubtasks = (task.subtasks || []).filter(s => s.done).length
                            return (
                                <div key={task._id} className="card" draggable
                                    onDragStart={e => onDragStart(e, task._id)}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => onDrop(e, task._id)}
                                    style={{ cursor: 'grab', border: dragId === task._id ? '1px solid var(--accent)' : isOverdue ? '1px solid var(--red)' : task.status === 'completed' ? '1px solid rgba(166,227,161,0.2)' : '1px solid var(--border)', opacity: task.status === 'completed' ? 0.7 : 1, transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                        {/* Status toggle */}
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }}
                                            onClick={() => { const next = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending', skipped: 'pending' }; setStatus(task._id, next[task.status]) }}>
                                            {STATUS_ICON[task.status]}
                                        </button>

                                        {/* Title & meta */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)' }}>{task.title}</span>
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} title={task.priority + ' priority'} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: task.description ? '6px' : 0 }}>
                                                <span className="badge badge-blue">{CAT_ICON[task.category]} {task.category}</span>
                                                {task.deadline && <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>📅 {task.deadline}{isOverdue ? ' ⚠️' : ''}</span>}
                                                {task.isRecurring && <span className="badge badge-purple">🔁 Recurring</span>}
                                                {task.todaysFocus && <span className="badge badge-yellow">⭐ Focus</span>}
                                                {task.timeSpent > 0 && <span className="badge badge-green">⏱️ {fmtTime(task.timeSpent)}</span>}
                                            </div>
                                            {task.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0' }}>{task.description}</p>}
                                            {/* Subtasks */}
                                            {task.subtasks?.length > 0 && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <div style={{ height: '4px', background: 'rgba(49,50,68,0.6)', borderRadius: '2px', marginBottom: '6px' }}>
                                                        <div style={{ height: '100%', width: `${(doneSubtasks / task.subtasks.length) * 100}%`, background: 'var(--green)', borderRadius: '2px', transition: 'width 0.4s' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {task.subtasks.map((s, i) => (
                                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: s.done ? 'var(--text-muted)' : 'var(--text)' }}>
                                                                <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(task, i)} />
                                                                <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{doneSubtasks}/{task.subtasks.length} done</div>
                                                </div>
                                            )}
                                            {task.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>📝 {task.notes}</p>}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                            <button className="btn-icon" title="Toggle focus" onClick={() => toggleFocus(task)} style={{ color: task.todaysFocus ? 'var(--yellow)' : 'var(--text-muted)' }}>⭐</button>
                                            <button className="btn-icon" title={activeTimer === task._id ? 'Stop timer' : 'Start timer'}
                                                onClick={() => activeTimer === task._id ? stopTimer() : startTimer(task._id)}
                                                style={{ color: activeTimer === task._id ? 'var(--red)' : 'var(--text-muted)' }}>
                                                {activeTimer === task._id ? '⏹' : '▶️'}
                                            </button>
                                            <button className="btn-icon" onClick={() => openEdit(task)}>✏️</button>
                                            <button className="btn-icon" onClick={() => deleteTask(task._id)}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Analytics View */}
            {view === 'analytics' && stats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="stats-grid">
                        {[
                            { icon: '✅', label: 'Completed', value: stats.completed, color: 'var(--green)' },
                            { icon: '🔵', label: 'In Progress', value: stats.inProgress, color: 'var(--accent)' },
                            { icon: '⬜', label: 'Pending', value: stats.pending, color: 'var(--text-muted)' },
                            { icon: '⚠️', label: 'Overdue', value: stats.overdue, color: 'var(--red)' },
                            { icon: '⏭️', label: 'Skipped', value: stats.skipped, color: 'var(--purple)' },
                            { icon: '⏱️', label: 'Time Tracked', value: fmtTime(stats.totalTimeSpent), color: 'var(--yellow)' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <div className="stat-icon">{s.icon}</div>
                                <div className="stat-value" style={{ color: s.color, fontSize: '1.4rem' }}>{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Weekly chart */}
                    <div className="card">
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', marginBottom: '16px' }}>📈 Weekly Performance</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={stats.weekly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,121,153,0.15)" />
                                <XAxis dataKey="day" tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#7c7f93', fontSize: 11 }} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="completed" fill="#a6e3a1" radius={[4, 4, 0, 0]} name="Completed" />
                                <Bar dataKey="created" fill="#89b4fa" radius={[4, 4, 0, 0]} name="Created" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category breakdown */}
                    <div className="card">
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', marginBottom: '16px' }}>📂 By Category</h3>
                        {Object.entries(stats.byCategory).length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tasks yet</p>
                            : Object.entries(stats.byCategory).map(([cat, d]) => (
                                <div key={cat} style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        <span>{CAT_ICON[cat]} {cat}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{d.done}/{d.total}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${d.total ? (d.done / d.total) * 100 : 0}%`, background: 'var(--gradient-2)' }} />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '540px' }}>
                        <div className="modal-header">
                            <h3>{editTask ? '✏️ Edit Task' : '✅ New Task'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input className="form-control" placeholder="Task title..." value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_ICON[p]} {p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Deadline</label>
                                    <input type="date" className="form-control" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="form-control" rows={2} placeholder="Optional details..." value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>

                            {/* Subtasks */}
                            <div className="form-group">
                                <label>Subtasks</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input className="form-control" placeholder="Add subtask..." value={subtaskInput}
                                        onChange={e => setSubtaskInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }} />
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={addSubtask}>+</button>
                                </div>
                                {(form.subtasks || []).map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'rgba(49,50,68,0.5)', borderRadius: '6px', marginBottom: '4px' }}>
                                        <span style={{ flex: 1, fontSize: '0.8rem' }}>• {s.title}</span>
                                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.9rem' }} onClick={() => removeSubtask(i)}>×</button>
                                    </div>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>Notes</label>
                                <textarea className="form-control" rows={2} placeholder="Extra notes..." value={form.notes}
                                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>

                            {/* Toggles */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={form.todaysFocus} onChange={e => setForm(f => ({ ...f, todaysFocus: e.target.checked }))} />
                                    ⭐ Today's Focus
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
                                    🔁 Recurring Task
                                </label>
                            </div>

                            {form.isRecurring && (
                                <div className="form-group">
                                    <label>Repeat on days</label>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {DAYS.map(d => (
                                            <button key={d} type="button"
                                                className={`btn btn-sm ${form.recurringDays?.includes(d) ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => setForm(f => ({ ...f, recurringDays: f.recurringDays?.includes(d) ? f.recurringDays.filter(x => x !== d) : [...(f.recurringDays || []), d] }))}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                {editTask ? '💾 Save Changes' : '✅ Create Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
