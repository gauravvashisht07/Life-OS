import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/habits', icon: '🔥', label: 'Habits' },
    { to: '/goals', icon: '🎯', label: 'Goals' },
    { to: '/tasks', icon: '✅', label: 'Tasks' },
    { to: '/study', icon: '📚', label: 'Study' },
    { to: '/journal', icon: '📝', label: 'Journal' },
    { to: '/finance', icon: '💰', label: 'Finance' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
]

export default function Sidebar({ open, onClose }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
    const xpPerLevel = 500
    const xpProgress = ((user?.xp || 0) % xpPerLevel) / xpPerLevel * 100

    const handleLogout = () => { logout(); navigate('/auth'); onClose?.() }
    const handleNav = () => { onClose?.() }

    return (
        <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
            <div className="sidebar-logo">
                <h1>⚡ LifeOS</h1>
                <span>Personal Life Dashboard</span>
            </div>

            <nav className="sidebar-nav">
                {navLinks.map(({ to, icon, label }) => (
                    <NavLink
                        key={to} to={to} end={to === '/'}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        onClick={handleNav}
                    >
                        <span className="icon">{icon}</span>
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{initials}</div>
                    <div>
                        <div className="user-name">{user?.name || 'User'}</div>
                        <div className="user-level">Level {user?.level || 1} · {user?.xp || 0} XP</div>
                    </div>
                </div>
                <div className="sidebar-xp">
                    <div className="xp-header">
                        <span>XP Progress</span>
                        <span>{(user?.xp || 0) % xpPerLevel} / {xpPerLevel}</span>
                    </div>
                    <div className="xp-track">
                        <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
                    </div>
                </div>
            <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
            </button>
            </div>
        </aside>
    )
}
