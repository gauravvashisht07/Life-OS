const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    content: { type: String, default: '' },
    mood: { type: Number, default: 5, min: 1, max: 10 },
    moodLabel: { type: String, default: 'Okay' },
    tags: [{ type: String }],
    gratitude: { type: String, default: '' },
    highlight: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Journal', journalSchema);
