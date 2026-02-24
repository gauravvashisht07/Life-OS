import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Background3D from './components/Background3D'
import Sidebar from './components/Sidebar'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import Goals from './pages/Goals'
import Study from './pages/Study'
import Journal from './pages/Journal'
import Finance from './pages/Finance'
import Analytics from './pages/Analytics'

function PrivateRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/auth" />
}

function AppLayout() {
    const { token } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="app-root">
            <Background3D />
            <Toaster
                position="top-right"
                toastOptions={{ style: { background: '#1e1e2e', color: '#cdd6f4', border: '1px solid #313244', fontSize: '0.875rem' } }}
            />

            {/* Mobile overlay */}
            {token && sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Mobile hamburger */}
            {token && (
                <button
                    className="hamburger-btn"
                    onClick={() => setSidebarOpen(o => !o)}
                    aria-label="Toggle sidebar"
                >
                    <span className={`ham-line ${sidebarOpen ? 'open' : ''}`} />
                    <span className={`ham-line ${sidebarOpen ? 'open' : ''}`} />
                    <span className={`ham-line ${sidebarOpen ? 'open' : ''}`} />
                </button>
            )}

            {token && (
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            )}

            <main className={`main-content ${token ? 'with-sidebar' : ''}`}>
                <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/habits" element={<PrivateRoute><Habits /></PrivateRoute>} />
                    <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
                    <Route path="/study" element={<PrivateRoute><Study /></PrivateRoute>} />
                    <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
                    <Route path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} />
                    <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppLayout />
            </BrowserRouter>
        </AuthProvider>
    )
}
