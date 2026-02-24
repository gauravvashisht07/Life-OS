const router = require('express').Router();
const auth = require('../middleware/auth');
const StudyLog = require('../models/StudyLog');
const Habit = require('../models/Habit');
const Journal = require('../models/Journal');
const Goal = require('../models/Goal');
const User = require('../models/User');

router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Study — last 30 days
        const since = new Date(); since.setDate(since.getDate() - 30);
        const sinceStr = since.toISOString().split('T')[0];
        const studyLogs = await StudyLog.find({ user: userId, date: { $gte: sinceStr } }).sort({ date: 1 });
        const studyByDay = {};
        studyLogs.forEach(l => { studyByDay[l.date] = (studyByDay[l.date] || 0) + l.hoursSpent; });

        // Mood history
        const journals = await Journal.find({ user: userId }).select('date mood').sort({ date: 1 }).limit(30);

        // Goals
        const allGoals = await Goal.find({ user: userId });
        const goalStats = {
            total: allGoals.length,
            completed: allGoals.filter(g => g.status === 'completed').length,
            active: allGoals.filter(g => g.status === 'active').length,
            avgProgress: allGoals.length ? Math.round(allGoals.reduce((s, g) => s + g.progress, 0) / allGoals.length) : 0,
        };

        // Habits
        const allHabits = await Habit.find({ user: userId });
        const today = new Date().toISOString().split('T')[0];
        const doneToday = allHabits.filter(h => h.checkIns.some(c => c.date === today)).length;
        const habitStats = {
            total: allHabits.length, doneToday,
            streaks: allHabits.map(h => ({ name: h.name, streak: h.streak })),
        };

        // User
        const user = await User.findById(userId).select('-password');

        res.json({ studyByDay, moodHistory: journals, goalStats, habitStats, user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
