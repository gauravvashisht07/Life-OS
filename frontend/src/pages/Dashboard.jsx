import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const xpPerLevel = 500

export default function Dashboard() {
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/analytics/dashboard')
            .then(r => { setAnalytics(r.data); if (r.data.user) updateUser(r.data.user) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const level = user?.level || 1
    const xp = user?.xp || 0
    const xpInLevel = xp % xpPerLevel
    const xpProgress = (xpInLevel / xpPerLevel) * 100

    const greetingHour = new Date().getHours()
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    if (loading) return <div className="page loading"><div className="spinner" /></div>

    const { goalStats, habitStats, studyByDay } = analytics || {}
    const totalStudyHours = Object.values(studyByDay || {}).reduce((s, v) => s + v, 0).toFixed(1)

    const statCards = [
        { icon: '🎯', value: goalStats?.active || 0, label: 'Active Goals', color: 'var(--accent)', path: '/goals' },
        { icon: '🔥', value: `${habitStats?.doneToday || 0}/${habitStats?.total || 0}`, label: "Habits Today", color: 'var(--orange)', path: '/habits' },
        { icon: '📚', value: `${totalStudyHours}h`, label: 'Study (30d)', color: 'var(--green)', path: '/study' },
        { icon: '✅', value: goalStats?.completed || 0, label: 'Goals Completed', color: 'var(--purple)', path: '/goals' },
        { icon: '🏆', value: `Lv ${level}`, label: 'Your Level', color: 'var(--yellow)', path: '/analytics' },
        { icon: '⚡', value: `${xp} XP`, label: 'Total XP Earned', color: 'var(--teal)', path: '/analytics' },
    ]

    const topStreaks = (habitStats?.streaks || []).sort((a, b) => b.streak - a.streak).slice(0, 3)
    const recentMoods = (analytics?.moodHistory || []).slice(-7)

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h2>{greeting}, {user?.name?.split(' ')[0]} 👋</h2>
                <p>{today} · Keep leveling up!</p>
            </div>

            {/* XP Bar */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="xp-bar-header">
                    <span className="xp-level">⚡ Level {level}</span>
                    <span className="xp-text">{xpInLevel} / {xpPerLevel} XP to Level {level + 1}</span>
                </div>
                <div className="xp-track">
                    <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
                </div>
                {user?.badges?.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {user.badges.map(b => <span key={b} className="badge badge-yellow">{b}</span>)}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map(({ icon, value, label, color, path }) => (
                    <div key={label} className="stat-card" onClick={() => navigate(path)} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon">{icon}</div>
                        <div className="stat-value" style={{ color }}>{value}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: '20px' }}>
                {/* Top Streaks */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: '16px', fontSize: '1rem' }}>🔥 Top Streaks</h3>
                    {topStreaks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px' }}>
                            <div className="emoji">🌱</div>
                            <p>Start habits to build streaks!</p>
                        </div>
                    ) : topStreaks.map(({ name, streak }) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.9rem' }}>{name}</span>
                            <span className="streak-badge">🔥 {streak} days</span>
                        </div>
                    ))}
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '14px', width: '100%' }} onClick={() => navigate('/habits')}>View All Habits →</button>
                </div>

                {/* Recent Mood */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: '16px', fontSize: '1rem' }}>😊 Recent Mood</h3>
                    {recentMoods.length === 0 ? (
                        <div className="empty-state" style={{ padding: '20px' }}>
                            <div className="emoji">📝</div>
                            <p>Start journaling to track mood!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
                            {recentMoods.map(({ date, mood }) => (
                                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <div style={{
                                        height: `${mood * 7}px`, width: '100%', borderRadius: '4px',
                                        background: `hsl(${(mood - 1) * 14}, 70%, 60%)`,
                                        minHeight: '8px', transition: 'all 0.5s ease'
                                    }} />
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(date).getDate()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '14px', width: '100%' }} onClick={() => navigate('/journal')}>Open Journal →</button>
                </div>

                {/* Goal Progress */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: '16px', fontSize: '1rem' }}>🎯 Goals Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[['Active', goalStats?.active || 0, 'var(--accent)'], ['Completed', goalStats?.completed || 0, 'var(--green)'], ['Total', goalStats?.total || 0, 'var(--purple)']].map(([label, val, color]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</span>
                                <span style={{ fontWeight: 700, color }}>{val}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '4px' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Avg Progress: {goalStats?.avgProgress || 0}%</div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${goalStats?.avgProgress || 0}%`, background: 'var(--gradient-1)' }} />
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: '14px', width: '100%' }} onClick={() => navigate('/goals')}>Manage Goals →</button>
                </div>

                {/* Quick links */}
                <div className="card">
                    <h3 style={{ fontFamily: 'Space Grotesk', marginBottom: '16px', fontSize: '1rem' }}>⚡ Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[['📝 Write Today\'s Journal', '/journal'], ['📚 Log Study Session', '/study'], ['💰 Add an Expense', '/finance'], ['📊 View Analytics', '/analytics']].map(([label, path]) => (
                            <button key={path} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate(path)}>{label}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
