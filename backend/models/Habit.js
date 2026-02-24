const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '⭐' },
    color: { type: String, default: '#6366f1' },
    frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    checkIns: [{ date: { type: String }, completed: { type: Boolean, default: true } }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', habitSchema);
