const router = require('express').Router();
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
    try { res.json(await Habit.find({ user: req.user.id }).sort({ createdAt: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try { res.status(201).json(await Habit.create({ ...req.body, user: req.user.id })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/checkin', auth, async (req, res) => {
    try {
        const habit = await Habit.findOne({ _id: req.params.id, user: req.user.id });
        if (!habit) return res.status(404).json({ message: 'Habit not found' });

        const today = new Date().toISOString().split('T')[0];
        if (habit.checkIns.some(c => c.date === today))
            return res.status(400).json({ message: 'Already checked in today' });

        habit.checkIns.push({ date: today });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        habit.streak = habit.checkIns.some(c => c.date === yStr) ? habit.streak + 1 : 1;
        if (habit.streak > habit.longestStreak) habit.longestStreak = habit.streak;
        await habit.save();

        // Award +10 XP
        const user = await User.findById(req.user.id);
        const newXp = (user.xp || 0) + 10;
        await User.findByIdAndUpdate(req.user.id, { xp: newXp, level: Math.floor(newXp / 500) + 1 });

        res.json(habit);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
    try { res.json(await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try { await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
