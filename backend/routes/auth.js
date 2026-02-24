const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { users } = require('../db/db')

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body
        const existing = await users.findOne({ email })
        if (existing) return res.status(400).json({ message: 'Email already registered' })
        const hashed = await bcrypt.hash(password, 10)
        const user = await users.insert({ name, email, password: hashed, xp: 0, level: 1, streak: 0, badges: [], createdAt: new Date().toISOString() })
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'lifeos_secret', { expiresIn: '7d' })
        res.json({ token, user: { id: user._id, name, email, xp: 0, level: 1, streak: 0, badges: [] } })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await users.findOne({ email })
        if (!user) return res.status(400).json({ message: 'Invalid credentials' })
        const match = await bcrypt.compare(password, user.password)
        if (!match) return res.status(400).json({ message: 'Invalid credentials' })
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'lifeos_secret', { expiresIn: '7d' })
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, xp: user.xp, level: user.level, streak: user.streak, badges: user.badges } })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await users.findOne({ _id: req.user.id })
        if (!user) return res.status(404).json({ message: 'User not found' })
        const { password, ...safe } = user
        res.json(safe)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
