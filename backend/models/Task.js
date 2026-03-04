const mongoose = require('mongoose')

const SubtaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
})

const TaskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['Study', 'Coding', 'Health', 'Personal', 'Work', 'Other'], default: 'Personal' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'skipped'], default: 'pending' },
    deadline: { type: String, default: '' },   // YYYY-MM-DD
    subtasks: [SubtaskSchema],
    notes: { type: String, default: '' },
    todaysFocus: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    recurringDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    timeSpent: { type: Number, default: 0 },    // seconds
    order: { type: Number, default: 0 },    // for drag-and-drop ordering
    completedAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Task', TaskSchema)
