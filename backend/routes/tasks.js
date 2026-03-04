const router = require('express').Router()
const auth = require('../middleware/auth')
const Task = require('../models/Task')

// GET all tasks
router.get('/', auth, async (req, res) => {
    try {
        const { status, category, priority, focus } = req.query
        const filter = { user: req.user.id }
        if (status) filter.status = status
        if (category) filter.category = category
        if (priority) filter.priority = priority
        if (focus === 'true') filter.todaysFocus = true
        const tasks = await Task.find(filter).sort({ order: 1, createdAt: -1 })
        res.json(tasks)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST create task
router.post('/', auth, async (req, res) => {
    try {
        const count = await Task.countDocuments({ user: req.user.id })
        const task = await Task.create({ ...req.body, user: req.user.id, order: count })
        res.status(201).json(task)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT update task
router.put('/:id', auth, async (req, res) => {
    try {
        const update = { ...req.body }
        if (req.body.status === 'completed' && !req.body.completedAt) {
            update.completedAt = new Date()
        }
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            update, { new: true }
        )
        res.json(task)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE task
router.delete('/:id', auth, async (req, res) => {
    try {
        await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id })
        res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH update time spent (timer)
router.patch('/:id/timer', auth, async (req, res) => {
    try {
        const { seconds } = req.body
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $inc: { timeSpent: seconds } },
            { new: true }
        )
        res.json(task)
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH reorder tasks
router.patch('/reorder', auth, async (req, res) => {
    try {
        const { orderedIds } = req.body // array of task IDs in new order
        await Promise.all(
            orderedIds.map((id, idx) =>
                Task.findOneAndUpdate({ _id: id, user: req.user.id }, { order: idx })
            )
        )
        res.json({ message: 'Reordered' })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET stats / analytics
router.get('/stats', auth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id })
        const today = new Date().toISOString().split('T')[0]

        // Weekly (last 7 days)
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i))
            return d.toISOString().split('T')[0]
        })

        const weekly = weekDays.map(day => ({
            day: day.slice(5),
            completed: tasks.filter(t =>
                t.completedAt && t.completedAt.toISOString().split('T')[0] === day
            ).length,
            created: tasks.filter(t =>
                t.createdAt && t.createdAt.toISOString().split('T')[0] === day
            ).length,
        }))

        const byCategory = {}
        tasks.forEach(t => {
            if (!byCategory[t.category]) byCategory[t.category] = { total: 0, done: 0 }
            byCategory[t.category].total++
            if (t.status === 'completed') byCategory[t.category].done++
        })

        const overdue = tasks.filter(t =>
            t.deadline && t.deadline < today && t.status !== 'completed'
        ).length

        res.json({
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'completed').length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            skipped: tasks.filter(t => t.status === 'skipped').length,
            overdue,
            byCategory,
            weekly,
            totalTimeSpent: tasks.reduce((s, t) => s + (t.timeSpent || 0), 0),
        })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
