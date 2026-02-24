import { useEffect, useState } from 'react'
import axios from 'axios'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Legend
} from 'recharts'

const tooltipStyle = { background: '#1e1e2e', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }

export default function Analytics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [studyStats, setStudyStats] = useState(null)
    const [finSummary, setFinSummary] = useState(null)

    useEffect(() => {
        Promise.all([
            axios.get('/api/analytics/dashboard'),
            axios.get('/api/study/stats'),
            axios.get('/api/finance/summary'),
        ]).then(([a, s, f]) => {
            setData(a.data); setStudyStats(s.data); setFinSummary(f.data)
            setLoading(false)
        }).catch(console.error)
    }, [])

    if (loading) return <div className="page loading"><div className="spinner" /></div>

    // Study hours chart — last 14 days
    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i))
        const str = d.toISOString().split('T')[0]
        return { date: str.slice(5), hours: data?.studyByDay?.[str] || 0 }
    })

    // Mood chart
    const moodData = (data?.moodHistory || []).slice(-14).map(e => ({
        date: e.date?.slice(5),
        mood: e.mood
    }))

    // Study by category
    const catData = Object.entries(studyStats?.byCategory || {}).map(([cat, hours]) => ({ cat, hours: Number(hours.toFixed(1)) }))

    // Finance bar
    const finBar = finSummary ? [{ name: 'Overview', Income: finSummary.income, Expenses: finSummary.expenses, Balance: Math.max(finSummary.balance, 0) }] : []

    const habitStreaks = (data?.habitStats?.streaks || []).sort((a, b) => b.streak - a.streak).slice(0, 5)

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h2>📊 Analytics</h2>
                <p>Your life in numbers</p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                {[
                    { icon: '📚', value: `${(studyStats?.totalHours || 0).toFixed(1)}h`, label: 'Total Study Hours', color: 'var(--accent)' },
                    { icon: '✅', value: studyStats?.totalQuestions || 0, label: 'Questions Solved', color: 'var(--green)' },
                    { icon: '🎯', value: data?.goalStats?.completed || 0, label: 'Goals Completed', color: 'var(--purple)' },
                    { icon: '💰', value: `₹${(finSummary?.balance || 0).toLocaleString()}`, label: 'Net Balance', color: (finSummary?.balance || 0) >= 0 ? 'var(--green)' : 'var(--red)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-icon">{s.icon}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Study Hours Line Chart */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>📈 Study Hours — Last 14 Days</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={last14}>
                        <defs>
                            <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#89b4fa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#89b4fa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,121,153,0.15)" />
                        <XAxis dataKey="date" tick={{ fill: '#7c7f93', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#7c7f93', fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="hours" stroke="#89b4fa" fill="url(#studyGrad)" strokeWidth={2} dot={{ fill: '#89b4fa', r: 3 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                {/* Mood Trend */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>😊 Mood Trend</h3>
                    {moodData.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px' }}><div className="emoji">📝</div><p>Log journal entries to see mood trend</p></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={moodData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,121,153,0.15)" />
                                <XAxis dataKey="date" tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <YAxis domain={[1, 10]} tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="monotone" dataKey="mood" stroke="#cba6f7" strokeWidth={2} dot={{ fill: '#cba6f7', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Study by Category */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>📚 Study by Category</h3>
                    {catData.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px' }}><div className="emoji">📖</div><p>Log study sessions to see breakdown</p></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={catData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,121,153,0.15)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <YAxis type="category" dataKey="cat" tick={{ fill: '#7c7f93', fontSize: 11 }} width={80} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="hours" fill="#a6e3a1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
                {/* Finance Overview */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>💰 Finance Overview</h3>
                    {finBar.length === 0 || (!finSummary?.income && !finSummary?.expenses) ? (
                        <div className="empty-state" style={{ padding: '20px' }}><div className="emoji">💳</div><p>Add transactions to see finance chart</p></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={[{ name: 'Overview', Income: finSummary?.income || 0, Expenses: finSummary?.expenses || 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(113,121,153,0.15)" />
                                <XAxis dataKey="name" tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#7c7f93', fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${v.toLocaleString()}`} />
                                <Legend wrapperStyle={{ color: '#7c7f93', fontSize: '12px' }} />
                                <Bar dataKey="Income" fill="#a6e3a1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#f38ba8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top Habit Streaks */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1rem', marginBottom: '16px' }}>🔥 Top Habit Streaks</h3>
                    {habitStreaks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px' }}><div className="emoji">🌱</div><p>Build habits to track streaks</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {habitStreaks.map(({ name, streak }) => (
                                <div key={name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                        <span>{name}</span><span className="streak-badge">🔥 {streak}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${Math.min((streak / 30) * 100, 100)}%`, background: 'var(--gradient-4)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
