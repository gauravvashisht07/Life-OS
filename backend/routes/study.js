const router = require('express').Router();
const auth = require('../middleware/auth');
const StudyLog = require('../models/StudyLog');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
    try { res.json(await StudyLog.find({ user: req.user.id }).sort({ date: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try {
        const log = await StudyLog.create({ ...req.body, user: req.user.id });
        const xp = Math.round((req.body.hoursSpent || 0) * 15 + (req.body.questionsSolved || 0) * 5);
        const user = await User.findById(req.user.id);
        const newXp = (user.xp || 0) + xp;
        await User.findByIdAndUpdate(req.user.id, { xp: newXp, level: Math.floor(newXp / 500) + 1 });
        res.status(201).json(log);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
    try { res.json(await StudyLog.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try { await StudyLog.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
    try {
        const logs = await StudyLog.find({ user: req.user.id });
        const totalHours = logs.reduce((s, l) => s + l.hoursSpent, 0);
        const totalQuestions = logs.reduce((s, l) => s + l.questionsSolved, 0);
        const byCategory = {};
        logs.forEach(l => { byCategory[l.category] = (byCategory[l.category] || 0) + l.hoursSpent; });
        const avgConfidence = logs.length ? logs.reduce((s, l) => s + l.confidence, 0) / logs.length : 0;
        res.json({ totalHours, totalQuestions, byCategory, avgConfidence, totalSessions: logs.length });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
