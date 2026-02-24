const router = require('express').Router();
const auth = require('../middleware/auth');
const Finance = require('../models/Finance');

router.get('/', auth, async (req, res) => {
    try { res.json(await Finance.find({ user: req.user.id }).sort({ date: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try { res.status(201).json(await Finance.create({ ...req.body, user: req.user.id })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
    try { res.json(await Finance.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true })); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try { await Finance.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/summary', auth, async (req, res) => {
    try {
        const records = await Finance.find({ user: req.user.id });
        const income = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const expenses = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
        const byCategory = {};
        records.forEach(r => {
            if (!byCategory[r.category]) byCategory[r.category] = { income: 0, expense: 0 };
            byCategory[r.category][r.type] += r.amount;
        });
        res.json({ income, expenses, balance: income - expenses, byCategory });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
