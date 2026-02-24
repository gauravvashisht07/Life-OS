import axios from 'axios'

// In production (Vercel), use the deployed backend URL from env
// In development, Vite proxy handles /api → localhost:5000
const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL })

// Automatically attach JWT token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('lifeos_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

export default api
