import { useState, useEffect, useRef } from 'react'
import axios from '../api'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Modal from '../components/Modal'

const CATEGORIES = ['Study', 'Coding', 'Health', 'Personal', 'Work', 'Other']
const PRIORITIES = ['high', 'medium', 'low']
const STATUSES = ['pending', 'in-progress', 'completed', 'skipped']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const RECUR_TYPES = ['none', 'daily', 'weekly', 'monthly']
const EST_TIMES = ['15min', '30min', '1hr', '2hr', '4hr', 'Full day']

const PRIORITY_COLOR = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' }
const PRIORITY_ICON = { high: '🔴', medium: '🟡', low: '🟢' }
const STATUS_ICON = { pending: '⬜', 'in-progress': '🔵', completed: '✅', skipped: '⏭️' }
const CAT_ICON = { Study: '📚', Coding: '💻', Health: '🏃', Personal: '👤', Work: '💼', Other: '📌' }
const tooltipStyle = { background: '#1e1e2e', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }

function fmtTime(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
    return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`
}

const blank = {
    title: '', description: '', category: 'Personal', priority: 'medium',
    status: 'pending', deadline: '', notes: '', todaysFocus: false,
    isRecurring: false, recurringType: 'none', recurringDays: [],
    subtasks: [], estimatedTime: ''
}

function SectionLabel({ children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 14px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{children}</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>
    )
}

export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [stats, setStats] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [form, setForm] = useState(blank)
    const [subtaskInput, setSubtaskInput] = useState('')
    const [filter, setFilter] = useState({ status: '', category: '', priority: '' })
    const [view, setView] = useState('tasks')
    const [activeTimer, setActiveTimer] = useState(null)
    const [timerSec, setTimerSec] = useState(0)
    const [dragId, setDragId] = useState(null)
    const timerRef = useRef(null)

    const fetchAll = async () => {
        const [t, s] = await Promise.all([axios.get('/api/tasks'), axios.get('/api/tasks/stats')])
        setTasks(t.data); setStats(s.data)
    }
    useEffect(() => { fetchAll().catch(console.error) }, [])

    useEffect(() => {
        if (activeTimer) { timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000) }
        else { clearInterval(timerRef.current) }
        return () => clearInterval(timerRef.current)
    }, [activeTimer])

    const startTimer = (id) => { setActiveTimer(id); setTimerSec(0) }
    const stopTimer = async () => {
        clearInterval(timerRef.current)
        if (timerSec > 0) { await axios.patch(`/api/tasks/${activeTimer}/timer`, { seconds: timerSec }); toast.success(`⏱️ +${fmtTime(timerSec)} logged`); fetchAll() }
        setActiveTimer(null); setTimerSec(0)
    }

    const openCreate = () => { setForm(blank); setEditTask(null); setSubtaskInput(''); setShowModal(true) }
    const openEdit = (t) => {
        setForm({
            ...t,
            recurringType: t.recurringType || (t.isRecurring ? 'weekly' : 'none'),
            recurringDays: t.recurringDays || [],
            subtasks: t.subtasks || [],
            estimatedTime: t.estimatedTime || ''
        })
        setEditTask(t._id); setSubtaskInput(''); setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const payload = { ...form, isRecurring: form.recurringType !== 'none' }
            if (editTask) await axios.put(`/api/tasks/${editTask}`, payload)
            else await axios.post('/api/tasks', payload)
            toast.success(editTask ? '✏️ Task updated!' : '✅ Task created!')
            setShowModal(false); fetchAll()
        } catch { toast.error('Failed to save task') }
    }

    const setStatus = async (id, status) => { await axios.put(`/api/tasks/${id}`, { status }); fetchAll() }
    const toggleFocus = async (t) => { await axios.put(`/api/tasks/${t._id}`, { todaysFocus: !t.todaysFocus }); fetchAll() }
    const deleteTask = async (id) => { await axios.delete(`/api/tasks/${id}`); toast.success('🗑️ Deleted'); fetchAll() }
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

    const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move' }
    const onDrop = async (e, targetId) => {
        e.preventDefault()
        if (dragId === targetId) return
        const ids = tasks.map(t => t._id)
        const reordered = [...ids]; reordered.splice(reordered.indexOf(dragId), 1); reordered.splice(reordered.indexOf(targetId), 0, dragId)
        setTasks(reordered.map(id => tasks.find(t => t._id === id)))
        await axios.patch('/api/tasks/reorder', { orderedIds: reordered }); setDragId(null)
    }

    const filtered = tasks.filter(t =>
        (!filter.status || t.status === filter.status) &&
        (!filter.category || t.category === filter.category) &&
        (!filter.priority || t.priority === filter.priority)
    )
    const focusTasks = tasks.filter(t => t.todaysFocus && t.status !== 'completed')
    const today = new Date().toISOString().split('T')[0]
    const sf = v => setForm(f => ({ ...f, ...v }))

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

            {/* Timer Banner */}
            {activeTimer && (
                <div className="card" style={{ background: 'rgba(137,180,250,0.1)', border: '1px solid var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1s infinite' }} />
                        <span style={{ fontWeight: 700 }}>Timer running</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>{fmtTime(timerSec)}</span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={stopTimer}>⏹ Stop &amp; Save</button>
                </div>
            )}

            {view === 'tasks' && (
                <>
                    {/* Today's Focus */}
                    {focusTasks.length > 0 && (
                        <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(249,226,175,0.3)', background: 'rgba(249,226,175,0.05)' }}>
                            <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--yellow)' }}>⭐ Today's Focus</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {focusTasks.map(t => (
                                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(49,50,68,0.5)', borderRadius: '8px' }}>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} onClick={() => setStatus(t._id, t.status === 'completed' ? 'pending' : 'completed')}>{STATUS_ICON[t.status]}</button>
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
                        {[['status', STATUSES, STATUS_ICON], ['category', CATEGORIES, CAT_ICON], ['priority', PRIORITIES, PRIORITY_ICON]].map(([key, opts, icons]) => (
                            <select key={key} className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
                                value={filter[key]} onChange={e => setFilter(f => ({ ...f, [key]: e.target.value }))}>
                                <option value="">All {key.charAt(0).toUpperCase() + key.slice(1)}</option>
                                {opts.map(o => <option key={o} value={o}>{icons[o]} {o}</option>)}
                            </select>
                        ))}
                        {(filter.status || filter.category || filter.priority) && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setFilter({ status: '', category: '', priority: '' })}>✕ Clear</button>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Task List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.length === 0
                            ? <div className="card empty-state"><div className="emoji">📋</div><h3>No tasks yet</h3><p>Create your first task!</p></div>
                            : filtered.map(task => {
                                const isOverdue = task.deadline && task.deadline < today && task.status !== 'completed'
                                const doneSubtasks = (task.subtasks || []).filter(s => s.done).length
                                const nextStatus = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending', skipped: 'pending' }
                                return (
                                    <div key={task._id} className="card" draggable
                                        onDragStart={e => onDragStart(e, task._id)} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, task._id)}
                                        style={{ cursor: 'grab', border: dragId === task._id ? '1px solid var(--accent)' : isOverdue ? '1px solid var(--red)' : task.status === 'completed' ? '1px solid rgba(166,227,161,0.2)' : '1px solid var(--border)', opacity: task.status === 'completed' ? 0.7 : 1, transition: 'all 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0, marginTop: '2px' }} onClick={() => setStatus(task._id, nextStatus[task.status])}>{STATUS_ICON[task.status]}</button>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)' }}>{task.title}</span>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                    <span className="badge badge-blue">{CAT_ICON[task.category]} {task.category}</span>
                                                    {task.deadline && <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>📅 {task.deadline}</span>}
                                                    {task.estimatedTime && <span className="badge badge-purple">⏳ {task.estimatedTime}</span>}
                                                    {task.isRecurring && <span className="badge badge-purple">🔁 {task.recurringType || 'recurring'}</span>}
                                                    {task.todaysFocus && <span className="badge badge-yellow">⭐</span>}
                                                    {task.timeSpent > 0 && <span className="badge badge-green">⏱️ {fmtTime(task.timeSpent)}</span>}
                                                </div>
                                                {task.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{task.notes}</p>}
                                                {task.subtasks?.length > 0 && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <div style={{ height: '3px', background: 'rgba(49,50,68,0.6)', borderRadius: '2px', marginBottom: '5px' }}>
                                                            <div style={{ height: '100%', width: `${(doneSubtasks / task.subtasks.length) * 100}%`, background: 'var(--green)', borderRadius: '2px', transition: 'width 0.4s' }} />
                                                        </div>
                                                        {task.subtasks.map((s, i) => (
                                                            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: s.done ? 'var(--text-muted)' : 'var(--text)', marginBottom: '2px' }}>
                                                                <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(task, i)} />
                                                                <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                                <button className="btn-icon" onClick={() => toggleFocus(task)} style={{ color: task.todaysFocus ? 'var(--yellow)' : 'var(--text-muted)' }}>⭐</button>
                                                <button className="btn-icon" onClick={() => activeTimer === task._id ? stopTimer() : startTimer(task._id)} style={{ color: activeTimer === task._id ? 'var(--red)' : 'var(--text-muted)' }}>{activeTimer === task._id ? '⏹' : '▶️'}</button>
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

            {/* Analytics */}
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
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '16px' }}>📈 Weekly Performance</h3>
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
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '16px' }}>📂 By Category</h3>
                        {Object.entries(stats.byCategory).length === 0
                            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tasks yet</p>
                            : Object.entries(stats.byCategory).map(([cat, d]) => (
                                <div key={cat} style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        <span>{CAT_ICON[cat]} {cat}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{d.done}/{d.total}</span>
                                    </div>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${d.total ? (d.done / d.total) * 100 : 0}%`, background: 'var(--gradient-2)' }} /></div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ── Modal ─────────────────────────────────────────────────────── */}
            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <div className="modal-header">
                    <h3>{editTask ? '✏️ Edit Task' : '✅ New Task'}</h3>
                    <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* ── SECTION 1: Basic Info ── */}
                    <SectionLabel>Basic Info</SectionLabel>

                    <div className="form-group">
                        <label>Title *</label>
                        <input className="form-control" placeholder="What do you need to do?" value={form.title} onChange={e => sf({ title: e.target.value })} required autoFocus />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <div className="pill-group">
                            {CATEGORIES.map(c => (
                                <button key={c} type="button"
                                    className={`pill-btn ${form.category === c ? 'pill-active' : ''}`}
                                    onClick={() => sf({ category: c })}>
                                    {CAT_ICON[c]} {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <div className="pill-group">
                            {PRIORITIES.map(p => (
                                <button key={p} type="button"
                                    className="pill-btn"
                                    style={{
                                        background: form.priority === p ? `${PRIORITY_COLOR[p]}22` : undefined,
                                        borderColor: form.priority === p ? PRIORITY_COLOR[p] : undefined,
                                        color: form.priority === p ? PRIORITY_COLOR[p] : undefined,
                                    }}
                                    onClick={() => sf({ priority: p })}>
                                    {PRIORITY_ICON[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── SECTION 2: Schedule ── */}
                    <SectionLabel>Schedule</SectionLabel>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select className="form-control" value={form.status} onChange={e => sf({ status: e.target.value })}>
                                {STATUSES.map(s => <option key={s} value={s}>{STATUS_ICON[s]} {s}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Deadline</label>
                            <input type="date" className="form-control" value={form.deadline} onChange={e => sf({ deadline: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Estimated Time</label>
                            <select className="form-control" value={form.estimatedTime} onChange={e => sf({ estimatedTime: e.target.value })}>
                                <option value="">Not set</option>
                                {EST_TIMES.map(t => <option key={t} value={t}>⏳ {t}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Today's Focus</label>
                            <button type="button"
                                onClick={() => sf({ todaysFocus: !form.todaysFocus })}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                                    border: form.todaysFocus ? '1px solid var(--yellow)' : '1px solid var(--border)',
                                    background: form.todaysFocus ? 'rgba(249,226,175,0.12)' : 'rgba(17,17,27,0.6)',
                                    color: form.todaysFocus ? 'var(--yellow)' : 'var(--text-muted)',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                                    transition: 'all 0.2s', textAlign: 'left'
                                }}>
                                {form.todaysFocus ? '⭐ In Today\'s Focus' : '☆ Add to Focus'}
                            </button>
                        </div>
                    </div>

                    {/* ── SECTION 3: Details ── */}
                    <SectionLabel>Details</SectionLabel>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea className="form-control" rows={3}
                            placeholder="Add any details, context, or extra notes…"
                            value={form.notes}
                            onChange={e => sf({ notes: e.target.value, description: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Subtasks <span style={{ color: 'var(--text-dim)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— press Enter to add</span></label>
                        <input className="form-control"
                            placeholder="Type a subtask and press Enter…"
                            value={subtaskInput}
                            onChange={e => setSubtaskInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }} />
                        {(form.subtasks || []).length > 0 && (
                            <div className="subtask-chips">
                                {(form.subtasks || []).map((s, i) => (
                                    <div key={i} className="subtask-chip">
                                        <span>• {s.title}</span>
                                        <button type="button" onClick={() => removeSubtask(i)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── SECTION 4: Advanced ── */}
                    <SectionLabel>Advanced</SectionLabel>

                    <div className="form-group">
                        <label>Recurring</label>
                        <div className="pill-group">
                            {RECUR_TYPES.map(r => (
                                <button key={r} type="button"
                                    className={`pill-btn ${form.recurringType === r ? 'pill-active' : ''}`}
                                    onClick={() => sf({ recurringType: r, isRecurring: r !== 'none' })}>
                                    {r === 'none' ? '🚫 None' : r === 'daily' ? '☀️ Daily' : r === 'weekly' ? '📅 Weekly' : '📆 Monthly'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.recurringType === 'weekly' && (
                        <div className="form-group">
                            <label>Repeat on</label>
                            <div className="pill-group">
                                {DAYS.map(d => (
                                    <button key={d} type="button"
                                        className={`pill-btn day-pill ${form.recurringDays?.includes(d) ? 'pill-active' : ''}`}
                                        onClick={() => sf({ recurringDays: form.recurringDays?.includes(d) ? form.recurringDays.filter(x => x !== d) : [...(form.recurringDays || []), d] })}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
                        {editTask ? '💾 Save Changes' : '✅ Create Task'}
                    </button>

                </form>
            </Modal>
        </div>
    )
}
