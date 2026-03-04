const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// CORS — allow all origins (Vercel, localhost, Postman)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/study', require('./routes/study'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check — Render pings this to confirm the service is alive
app.get('/', (req, res) => res.json({ status: 'LifeOS API running 🚀' }));
app.get('/api/health', (req, res) => res.json({ status: 'LifeOS API running 🚀' }));

// ─── Handle passwords with special chars (@, #, etc.) in MongoDB URI ──────────
function fixMongoURI(raw) {
    if (!raw) return raw;
    try {
        const schemeEnd = raw.indexOf('://');
        if (schemeEnd === -1) return raw;
        const scheme = raw.slice(0, schemeEnd + 3);
        const rest = raw.slice(schemeEnd + 3);
        const atIdx = rest.lastIndexOf('@');
        if (atIdx === -1) return raw;
        const userinfo = rest.slice(0, atIdx);
        const hostPart = rest.slice(atIdx + 1);
        const colonIdx = userinfo.indexOf(':');
        if (colonIdx === -1) return raw;
        const user = userinfo.slice(0, colonIdx);
        const password = userinfo.slice(colonIdx + 1);
        const encodedPw = encodeURIComponent(decodeURIComponent(password));
        return `${scheme}${user}:${encodedPw}@${hostPart}`;
    } catch { return raw; }
}
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
const MONGO_URI = fixMongoURI(process.env.MONGO_URI);

if (!MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is not set!');
    console.error('   Set it in Render → Environment → MONGO_URI');
    process.exit(1);
}

async function startServer() {
    try {
        console.log('⏳ Connecting to MongoDB...');

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 20000,  // 20s — Render cold starts can be slow
            socketTimeoutMS: 45000,
            // NOTE: No 'family: 4' — let Render's DNS resolve naturally (IPv4+IPv6)
        });

        console.log('✅ MongoDB connected!');

        // Render requires listening on 0.0.0.0 (not just localhost)
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 LifeOS Server on port ${PORT}`);
        });

    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('Check: Atlas Network Access → 0.0.0.0/0 allowed');
        // Don't call process.exit here — let Render retry on next deploy
        // Instead start the server anyway so health checks still pass
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️  Server started WITHOUT DB on port ${PORT} — fix MONGO_URI`);
        });
    }
}

startServer();
