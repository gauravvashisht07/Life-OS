import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('lifeos_token'))
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('lifeos_user') || 'null'))

    useEffect(() => {
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        else delete axios.defaults.headers.common['Authorization']
    }, [token])

    const login = (tok, userData) => {
        setToken(tok)
        setUser(userData)
        localStorage.setItem('lifeos_token', tok)
        localStorage.setItem('lifeos_user', JSON.stringify(userData))
        axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('lifeos_token')
        localStorage.removeItem('lifeos_user')
        delete axios.defaults.headers.common['Authorization']
    }

    const updateUser = (data) => {
        const updated = { ...user, ...data }
        setUser(updated)
        localStorage.setItem('lifeos_user', JSON.stringify(updated))
    }

    return (
        <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
