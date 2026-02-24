const router = require('express').Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
    try { res.json(await Goal.find({ user: req.user.id }).sort({ createdAt: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try { res.status(201).json(await Goal.create({ ...req.body, user: req.user.id })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
        if (req.body.status === 'completed') {
            const xpMap = { short: 50, mid: 150, long: 300 };
            const user = await User.findById(req.user.id);
            const newXp = (user.xp || 0) + (xpMap[goal.type] || 50);
            await User.findByIdAndUpdate(req.user.id, { xp: newXp, level: Math.floor(newXp / 500) + 1 });
        }
        res.json(goal);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try { await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
