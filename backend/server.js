const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (curl, Postman), localhost, and *.vercel.app
        if (!origin || origin.includes('localhost') || origin.includes('.vercel.app')) {
            cb(null, true);
        } else {
            cb(null, true); // allow all in free tier — restrict if needed
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/study', require('./routes/study'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/analytics', require('./routes/analytics'));
app.get('/api/health', (req, res) => res.json({ status: 'LifeOS API running 🚀' }));

// ─── Fix special characters in MongoDB URI password ──────────────────────────
// Handles passwords with @, #, /, ?, or other URL-unsafe characters
function fixMongoURI(raw) {
    if (!raw) return raw;
    try {
        // Split off the scheme (mongodb:// or mongodb+srv://)
        const schemeEnd = raw.indexOf('://');
        if (schemeEnd === -1) return raw;

        const scheme = raw.slice(0, schemeEnd + 3);          // "mongodb+srv://"
        const rest = raw.slice(schemeEnd + 3);              // "user:pass@host/db?opts"

        // Find the LAST '@' — everything before it is "userinfo"
        const atIdx = rest.lastIndexOf('@');
        if (atIdx === -1) return raw;                          // no credentials — return as-is

        const userinfo = rest.slice(0, atIdx);                // "user:pass"
        const hostPart = rest.slice(atIdx + 1);               // "host/db?opts"

        // Split userinfo into user and raw password (split only on FIRST colon)
        const colonIdx = userinfo.indexOf(':');
        if (colonIdx === -1) return raw;                       // no password

        const user = userinfo.slice(0, colonIdx);
        const password = userinfo.slice(colonIdx + 1);

        // Only encode if needed (avoid double-encoding)
        const encodedPw = encodeURIComponent(decodeURIComponent(password));

        const fixed = `${scheme}${user}:${encodedPw}@${hostPart}`;
        return fixed;
    } catch {
        return raw;   // if anything fails, return original
    }
}
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const MONGO_URI = fixMongoURI(process.env.MONGO_URI || 'mongodb://localhost:27017/lifeos');

async function startServer() {
    try {
        console.log('⏳ Connecting to MongoDB Atlas...');

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            family: 4,    // force IPv4 — prevents ::1 DNS issues on Windows
        });

        console.log('✅ MongoDB connected successfully!');
        app.listen(PORT, () => {
            console.log(`🚀 LifeOS Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('');
        console.error('🔧 Checklist:');
        console.error('  1. Atlas → Network Access → Add 0.0.0.0/0 (Allow from Anywhere)');
        console.error('  2. Atlas → Database Access → check that the DB user exists');
        console.error('  3. URI format must be: mongodb+srv://user:password@cluster0.XXXXX.mongodb.net/lifeos?retryWrites=true&w=majority');
        process.exit(1);
    }
}

startServer();
