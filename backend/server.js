const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/habits', require('./routes/habits'))
app.use('/api/goals', require('./routes/goals'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/study', require('./routes/study'))
app.use('/api/journal', require('./routes/journal'))
app.use('/api/finance', require('./routes/finance'))
app.use('/api/analytics', require('./routes/analytics'))

// Production setup
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')))
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
    })
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`)
})
