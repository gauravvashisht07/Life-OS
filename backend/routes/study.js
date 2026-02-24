const router = require('express').Router()
const auth = require('../middleware/auth')
const { study, users } = require('../db/db')

router.get('/', auth, async (req, res) => {
    try {
        const all = await study.find({ userId: req.user.id })
        res.json(all.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
    try {
        const log = await study.insert({ ...req.body, userId: req.user.id, createdAt: new Date().toISOString() })
        const xp = Math.round((req.body.hoursSpent || 0) * 15 + (req.body.questionsSolved || 0) * 5)
        const user = await users.findOne({ _id: req.user.id })
        const newXp = (user?.xp || 0) + xp
        await users.update({ _id: req.user.id }, { $set: { xp: newXp, level: Math.floor(newXp / 500) + 1 } })
        res.status(201).json(log)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
    try {
        await study.update({ _id: req.params.id, userId: req.user.id }, { $set: req.body })
        res.json(await study.findOne({ _id: req.params.id }))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        await study.remove({ _id: req.params.id, userId: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/stats', auth, async (req, res) => {
    try {
        const all = await study.find({ userId: req.user.id })
        const totalHours = all.reduce((s, l) => s + (l.hoursSpent || 0), 0)
        const totalQuestions = all.reduce((s, l) => s + (l.questionsSolved || 0), 0)
        const byCategory = {}
        all.forEach(l => { byCategory[l.category] = (byCategory[l.category] || 0) + (l.hoursSpent || 0) })
        const avgConfidence = all.length ? all.reduce((s, l) => s + (l.confidence || 0), 0) / all.length : 0
        res.json({ totalHours, totalQuestions, byCategory, avgConfidence, totalSessions: all.length })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
