import { useState } from 'react'
import axios from '../api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
    const [tab, setTab] = useState('login')
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
            const { data } = await axios.post(endpoint, form)
            login(data.token, data.user)
            toast.success(tab === 'login' ? `Welcome back, ${data.user.name}! 👋` : `Welcome to LifeOS, ${data.user.name}! 🚀`)
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>⚡ LifeOS</h1>
                    <p>Your all-in-one life management dashboard</p>
                </div>

                <div className="auth-tabs">
                    <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
                    <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Sign Up</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {tab === 'register' && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input className="form-control" placeholder="Your Name" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="you@example.com" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="••••••••" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                        {loading ? '⏳ Please wait...' : tab === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Track habits · Achieve goals · Level up your life
                </div>
            </div>
        </div>
    )
}
