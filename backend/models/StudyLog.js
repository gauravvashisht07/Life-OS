const mongoose = require('mongoose');

const studyLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    category: { type: String, enum: ['DSA', 'ML', 'Web', 'System Design', 'Other'], default: 'DSA' },
    subCategory: { type: String, default: '' },
    questionsSolved: { type: Number, default: 0 },
    hoursSpent: { type: Number, default: 0 },
    confidence: { type: Number, default: 3, min: 1, max: 5 },
    notes: { type: String, default: '' },
    resources: [{ type: String }],
    platform: { type: String, default: 'LeetCode' },
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudyLog', studyLogSchema);
