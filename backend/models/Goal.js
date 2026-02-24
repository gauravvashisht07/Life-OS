const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['short', 'mid', 'long'], required: true },
    category: { type: String, default: 'General' },
    deadline: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    milestones: [{ text: String, done: { type: Boolean, default: false } }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema);
