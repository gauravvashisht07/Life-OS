import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const MOODS = [
    { value: 1, emoji: '😭', label: 'Terrible' },
    { value: 2, emoji: '😞', label: 'Bad' },
    { value: 3, emoji: '😕', label: 'Meh' },
    { value: 4, emoji: '😐', label: 'Okay' },
    { value: 5, emoji: '🙂', label: 'Fine' },
    { value: 6, emoji: '😊', label: 'Good' },
    { value: 7, emoji: '😁', label: 'Great' },
    { value: 8, emoji: '🤩', label: 'Amazing' },
    { value: 9, emoji: '🥳', label: 'Fantastic' },
    { value: 10, emoji: '🚀', label: 'Peak' },
]

export default function Journal() {
    const [entries, setEntries] = useState([])
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], content: '', mood: 5, gratitude: '', highlight: '', tags: [] })
    const [tagInput, setTagInput] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchEntries = () => {
        axios.get('/api/journal').then(r => { setEntries(r.data); setLoading(false) }).catch(console.error)
    }
    useEffect(() => {
        fetchEntries()
    }, [])

    const selectedMood = MOODS.find(m => m.value === form.mood)

    const handleSave = async () => {
        try {
            const { data } = await axios.post('/api/journal', form)
            toast.success('📝 Journal saved!')
            fetchEntries()
            setSelected(data)
        } catch { toast.error('Failed to save') }
    }

    const handleSelectEntry = (entry) => {
        setSelected(entry)
        setForm({ date: entry.date, content: entry.content, mood: entry.mood, gratitude: entry.gratitude, highlight: entry.highlight, tags: entry.tags || [] })
    }

    const addTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
            setTagInput('')
        }
    }

    const removeTag = (idx) => setForm(f => ({ ...f, tags: f.tags.filter((_, i) => i !== idx) }))

    const newEntry = () => {
        setSelected(null)
        setForm({ date: new Date().toISOString().split('T')[0], content: '', mood: 5, gratitude: '', highlight: '', tags: [] })
    }

    const avgMood = entries.length ? (entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / Math.min(entries.length, 7)).toFixed(1) : '--'

    return (
        <div className="page fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>📝 Journal</h2>
                    <p>Daily reflection & mood tracking</p>
                </div>
                <button className="btn btn-primary" onClick={newEntry}>+ New Entry</button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                {[
                    { icon: '📅', value: entries.length, label: 'Total Entries', color: 'var(--accent)' },
                    { icon: '😊', value: avgMood, label: 'Avg Mood (7d)', color: 'var(--yellow)' },
                    { icon: '🔥', value: entries[0]?.date === new Date().toISOString().split('T')[0] ? '✅' : '—', label: "Today's Entry", color: 'var(--green)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: '20px', alignItems: 'flex-start' }}>
                {/* Entry List */}
                <div className="card" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>📅 Past Entries</h3>
                    {loading ? <div className="loading"><div className="spinner" /></div> :
                        entries.length === 0 ? <div className="empty-state" style={{ padding: '20px' }}><div className="emoji">📖</div><p>No entries yet</p></div> : (
                            entries.map(e => {
                                const mood = MOODS.find(m => m.value === e.mood) || MOODS[4]
                                return (
                                    <div key={e._id} onClick={() => handleSelectEntry(e)}
                                        style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px', border: `1px solid ${selected?._id === e._id ? 'var(--accent)' : 'var(--border)'}`, background: selected?._id === e._id ? 'rgba(137,180,250,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{e.date}</span>
                                            <span style={{ fontSize: '1.2rem' }}>{mood.emoji}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {e.content || e.highlight || 'No content'}
                                        </div>
                                    </div>
                                )
                            })
                        )
                    }
                </div>

                {/* Editor */}
                <div className="card" style={{ position: 'sticky', top: '24px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem' }}>
                            {selected ? `📖 ${selected.date}` : '✨ New Entry'}
                        </h3>
                        <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                            style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 10px' }} />
                    </div>

                    {/* Mood Picker */}
                    <div className="form-group">
                        <label>How are you feeling? {selectedMood?.emoji}</label>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {MOODS.map(m => (
                                <button key={m.value} type="button" className={`mood-btn ${form.mood === m.value ? 'selected' : ''}`}
                                    onClick={() => setForm({ ...form, mood: m.value })}>
                                    {m.emoji}
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>📝 Today's Reflection</label>
                        <textarea className="form-control" placeholder="What's on your mind today?" rows={4} value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>🙏 Gratitude</label>
                        <input className="form-control" placeholder="I am grateful for..." value={form.gratitude}
                            onChange={e => setForm({ ...form, gratitude: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>⭐ Today's Highlight</label>
                        <input className="form-control" placeholder="Best part of today..." value={form.highlight}
                            onChange={e => setForm({ ...form, highlight: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>🏷️ Tags (press Enter)</label>
                        <input className="form-control" placeholder="e.g. productive, gym..." value={tagInput}
                            onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} />
                        <div className="tags-list">
                            {form.tags.map((tag, i) => (
                                <span key={i} className="tag">{tag}<button onClick={() => removeTag(i)}>×</button></span>
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave}>
                        💾 Save Entry
                    </button>
                </div>
            </div>
        </div>
    )
}
