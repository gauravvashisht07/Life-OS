const router = require('express').Router()
const auth = require('../middleware/auth')
const { habits, users } = require('../db/db')

router.get('/', auth, async (req, res) => {
    try {
        const all = await habits.find({ userId: req.user.id })
        res.json(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth, async (req, res) => {
    try {
        const habit = await habits.insert({ ...req.body, userId: req.user.id, streak: 0, longestStreak: 0, checkIns: [], createdAt: new Date().toISOString() })
        res.status(201).json(habit)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/:id/checkin', auth, async (req, res) => {
    try {
        const habit = await habits.findOne({ _id: req.params.id, userId: req.user.id })
        if (!habit) return res.status(404).json({ message: 'Habit not found' })
        const today = new Date().toISOString().split('T')[0]
        if ((habit.checkIns || []).some(c => c.date === today)) return res.status(400).json({ message: 'Already checked in today' })
        const newCheckIns = [...(habit.checkIns || []), { date: today }]
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
        const yStr = yesterday.toISOString().split('T')[0]
        const hadYesterday = (habit.checkIns || []).some(c => c.date === yStr)
        const newStreak = hadYesterday ? (habit.streak || 0) + 1 : 1
        const newLongest = Math.max(habit.longestStreak || 0, newStreak)
        await habits.update({ _id: req.params.id }, { $set: { checkIns: newCheckIns, streak: newStreak, longestStreak: newLongest } })
        const user = await users.findOne({ _id: req.user.id })
        const newXp = (user?.xp || 0) + 10
        const newLevel = Math.floor(newXp / 500) + 1
        await users.update({ _id: req.user.id }, { $set: { xp: newXp, level: newLevel } })
        const updated = await habits.findOne({ _id: req.params.id })
        res.json(updated)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth, async (req, res) => {
    try {
        await habits.update({ _id: req.params.id, userId: req.user.id }, { $set: req.body })
        res.json(await habits.findOne({ _id: req.params.id }))
    } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        await habits.remove({ _id: req.params.id, userId: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
