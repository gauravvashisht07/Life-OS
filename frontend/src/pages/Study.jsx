import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const CATEGORIES = ['DSA', 'ML', 'Web', 'System Design', 'Other']
const PLATFORMS = ['LeetCode', 'Codeforces', 'HackerRank', 'Kaggle', 'YouTube', 'Book', 'Course', 'Other']

const DSA_TOPICS = ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'DP', 'Backtracking', 'Greedy', 'Binary Search', 'Hashing', 'Sorting', 'Stack/Queue', 'Heap', 'Tries', 'Segment Tree']
const ML_TOPICS = ['Linear Regression', 'Logistic Regression', 'Decision Trees', 'Random Forest', 'SVM', 'Neural Networks', 'CNN', 'RNN/LSTM', 'Transformers', 'Clustering', 'PCA', 'Feature Engineering', 'Model Evaluation', 'NLP', 'Reinforcement Learning']

function StarRating({ value, onChange }) {
    return (
        <div className="confidence-stars">
            {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`star ${s <= value ? 'filled' : 'empty'}`} onClick={() => onChange && onChange(s)}>★</span>
            ))}
        </div>
    )
}

export default function Study() {
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [activeTab, setActiveTab] = useState('DSA')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        topic: '', category: 'DSA', subCategory: '', questionsSolved: 0,
        hoursSpent: 1, confidence: 3, notes: '', platform: 'LeetCode',
        date: new Date().toISOString().split('T')[0]
    })

    const fetchData = async () => {
        const [logsRes, statsRes] = await Promise.all([axios.get('/api/study'), axios.get('/api/study/stats')])
        setLogs(logsRes.data); setStats(statsRes.data)
        setLoading(false)
    }
    useEffect(() => { fetchData().catch(console.error) }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            await axios.post('/api/study', form)
            const xp = Math.round(form.hoursSpent * 15 + form.questionsSolved * 5)
            toast.success(`📚 Session logged! +${xp} XP`)
            setShowModal(false); fetchData()
        } catch { toast.error('Failed to log session') }
    }

    const handleDelete = async (id) => {
        try { await axios.delete(`/api/study/${id}`); toast.success('Log removed'); fetchData() }
        catch { toast.error('Failed to delete') }
    }

    const filteredLogs = logs.filter(l => l.category === activeTab)
    const suggestions = activeTab === 'DSA' ? DSA_TOPICS : ML_TOPICS

    return (
        <div className="page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>📚 Study Tracker</h2>
                    <p>DSA, Machine Learning & beyond</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Session</button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                {[
                    { icon: '⏱️', value: `${(stats?.totalHours || 0).toFixed(1)}h`, label: 'Total Hours', color: 'var(--accent)' },
                    { icon: '✅', value: stats?.totalQuestions || 0, label: 'Questions Solved', color: 'var(--green)' },
                    { icon: '📑', value: stats?.totalSessions || 0, label: 'Sessions', color: 'var(--purple)' },
                    { icon: '⭐', value: `${(stats?.avgConfidence || 0).toFixed(1)}/5`, label: 'Avg Confidence', color: 'var(--yellow)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Category Breakdown */}
            {stats?.byCategory && Object.keys(stats.byCategory).length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>📊 Hours by Category</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(stats.byCategory).map(([cat, hrs]) => {
                            const pct = stats.totalHours ? (hrs / stats.totalHours) * 100 : 0
                            const colors = { DSA: 'var(--accent)', ML: 'var(--purple)', Web: 'var(--green)', 'System Design': 'var(--orange)', Other: 'var(--teal)' }
                            return (
                                <div key={cat}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        <span>{cat}</span><span style={{ color: 'var(--text-muted)' }}>{hrs.toFixed(1)}h</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[cat] || 'var(--accent)' }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                    <button key={c} className={`btn btn-sm ${activeTab === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(c)}>{c}</button>
                ))}
            </div>

            {/* Quick Topic Suggestions */}
            {(activeTab === 'DSA' || activeTab === 'ML') && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>TOPIC SUGGESTIONS</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {suggestions.map(t => {
                            const done = filteredLogs.some(l => l.topic === t)
                            return (
                                <button key={t} className="btn btn-sm btn-secondary"
                                    style={{ opacity: done ? 0.5 : 1, textDecoration: done ? 'line-through' : 'none', fontSize: '0.72rem' }}
                                    onClick={() => { setForm({ ...form, topic: t, category: activeTab }); setShowModal(true) }}>
                                    {done ? '✅' : '+'} {t}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {loading ? <div className="loading"><div className="spinner" /></div> : (
                filteredLogs.length === 0 ? (
                    <div className="empty-state"><div className="emoji">📖</div><h3>No {activeTab} sessions yet</h3><p>Log your first session!</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredLogs.map(log => (
                            <div key={log._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700 }}>{log.topic}</span>
                                        <span className="badge badge-blue">{log.platform}</span>
                                        {log.subCategory && <span className="badge badge-purple">{log.subCategory}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                        <span>⏱️ {log.hoursSpent}h</span>
                                        <span>✅ {log.questionsSolved} Qs</span>
                                        <span>📅 {log.date}</span>
                                        <StarRating value={log.confidence} />
                                    </div>
                                    {log.notes && <p style={{ font: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>{log.notes}</p>}
                                </div>
                                <button className="btn-icon" onClick={() => handleDelete(log._id)}>🗑️</button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div className="modal-header"><h3>📚 Log Study Session</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
                        <form onSubmit={handleCreate}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Platform</label>
                                    <select className="form-control" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Topic</label>
                                <input className="form-control" placeholder="e.g. Dynamic Programming" value={form.topic}
                                    onChange={e => setForm({ ...form, topic: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Hours Spent</label>
                                    <input type="number" min="0.5" max="24" step="0.5" className="form-control" value={form.hoursSpent}
                                        onChange={e => setForm({ ...form, hoursSpent: Number(e.target.value) })} />
                                </div>
                                <div className="form-group">
                                    <label>Questions Solved</label>
                                    <input type="number" min="0" className="form-control" value={form.questionsSolved}
                                        onChange={e => setForm({ ...form, questionsSolved: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Confidence (1–5)</label>
                                <StarRating value={form.confidence} onChange={v => setForm({ ...form, confidence: v })} />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea className="form-control" placeholder="What did you learn?" rows={2} value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                Log Session (+{Math.round(form.hoursSpent * 15 + form.questionsSolved * 5)} XP)
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
