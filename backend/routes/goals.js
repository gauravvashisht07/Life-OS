const router = require('express').Router()
const auth = require('../middleware/auth')
const { goals, users } = require('../db/db')

router.get('/', auth, async (req, res) => {
    try {
        const all = await goals.find({ userId: req.user.id })
        res.json(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
    try {
        const goal = await goals.insert({ ...req.body, userId: req.user.id, progress: 0, status: 'active', createdAt: new Date().toISOString() })
        res.status(201).json(goal)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
    try {
        await goals.update({ _id: req.params.id, userId: req.user.id }, { $set: req.body })
        if (req.body.status === 'completed') {
            const goal = await goals.findOne({ _id: req.params.id })
            const xpMap = { short: 50, mid: 150, long: 300 }
            const user = await users.findOne({ _id: req.user.id })
            const newXp = (user?.xp || 0) + (xpMap[goal?.type] || 50)
            const newLevel = Math.floor(newXp / 500) + 1
            await users.update({ _id: req.user.id }, { $set: { xp: newXp, level: newLevel } })
        }
        res.json(await goals.findOne({ _id: req.params.id }))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        await goals.remove({ _id: req.params.id, userId: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
