const router = require('express').Router();
const auth = require('../middleware/auth');
const Journal = require('../models/Journal');

router.get('/', auth, async (req, res) => {
    try { res.json(await Journal.find({ user: req.user.id }).sort({ date: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try {
        // Upsert — one entry per day
        const existing = await Journal.findOne({ user: req.user.id, date: req.body.date });
        if (existing) {
            const updated = await Journal.findByIdAndUpdate(existing._id, req.body, { new: true });
            return res.json(updated);
        }
        res.status(201).json(await Journal.create({ ...req.body, user: req.user.id }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
    try { res.json(await Journal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try { await Journal.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/mood-history', auth, async (req, res) => {
    try {
        const entries = await Journal.find({ user: req.user.id }).select('date mood moodLabel').sort({ date: 1 }).limit(30);
        res.json(entries);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
