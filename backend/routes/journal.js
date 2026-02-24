const router = require('express').Router()
const auth = require('../middleware/auth')
const { journal } = require('../db/db')

router.get('/', auth, async (req, res) => {
    try {
        const all = await journal.find({ userId: req.user.id })
        res.json(all.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
    try {
        const existing = await journal.findOne({ userId: req.user.id, date: req.body.date })
        if (existing) {
            await journal.update({ _id: existing._id }, { $set: req.body })
            return res.json(await journal.findOne({ _id: existing._id }))
        }
        const entry = await journal.insert({ ...req.body, userId: req.user.id, createdAt: new Date().toISOString() })
        res.status(201).json(entry)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
    try {
        await journal.update({ _id: req.params.id, userId: req.user.id }, { $set: req.body })
        res.json(await journal.findOne({ _id: req.params.id }))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        await journal.remove({ _id: req.params.id, userId: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/mood-history', auth, async (req, res) => {
    try {
        const all = await journal.find({ userId: req.user.id })
        const sorted = all.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-30)
        res.json(sorted.map(e => ({ date: e.date, mood: e.mood, moodLabel: e.moodLabel })))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
