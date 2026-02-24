const router = require('express').Router()
const auth = require('../middleware/auth')
const { study, habits, journal, goals, users } = require('../db/db')

router.get('/dashboard', auth, async (req, res) => {
    try {
        const uid = req.user.id

        // Study last 30 days
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const tStr = thirtyDaysAgo.toISOString().split('T')[0]
        const studyLogs = await study.find({ userId: uid })
        const recentStudy = studyLogs.filter(l => l.date >= tStr)
        const studyByDay = {}
        recentStudy.forEach(l => { studyByDay[l.date] = (studyByDay[l.date] || 0) + (l.hoursSpent || 0) })

        // Mood history
        const journals = await journal.find({ userId: uid })
        const moodHistory = journals
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-30).map(e => ({ date: e.date, mood: e.mood }))

        // Goals
        const allGoals = await goals.find({ userId: uid })
        const goalStats = {
            total: allGoals.length,
            completed: allGoals.filter(g => g.status === 'completed').length,
            active: allGoals.filter(g => g.status === 'active').length,
            avgProgress: allGoals.length ? Math.round(allGoals.reduce((s, g) => s + (g.progress || 0), 0) / allGoals.length) : 0
        }

        // Habits
        const allHabits = await habits.find({ userId: uid })
        const today = new Date().toISOString().split('T')[0]
        const doneToday = allHabits.filter(h => (h.checkIns || []).some(c => c.date === today)).length
        const habitStats = {
            total: allHabits.length,
            doneToday,
            streaks: allHabits.map(h => ({ name: h.name, streak: h.streak || 0 }))
        }

        // User
        const user = await users.findOne({ _id: uid })
        const { password, ...safeUser } = user || {}

        res.json({ studyByDay, moodHistory, goalStats, habitStats, user: safeUser })
    } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
