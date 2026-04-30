# Life-OS 🚀

Life-OS is a full-stack personal productivity and lifestyle management platform designed to unify multiple aspects of life—learning, habits, goals, finance, and mental wellness—into a single intelligent system.

## 🎯 Why Life-OS?

Managing productivity, learning, and personal growth across multiple apps is inefficient and fragmented. Life-OS solves this by providing a centralized platform where users can track, analyze, and improve all key areas of their life in one place.

---

## ✨ Features

* 🏆 **Gamified Habits** – Build consistency with streaks, XP, and leveling system
* 🎯 **Goal Kanban Board** – Manage short, mid, and long-term goals visually
* 📚 **Study Tracker** – Track DSA, ML, and learning progress with insights
* 📓 **Mood Journal** – Daily reflection with mood tracking
* 💰 **Finance Tracker + AI** – Manage expenses and get AI-powered financial insights
* ✅ **Smart Task Manager** – Prioritized, categorized, and trackable tasks
* 📊 **Analytics Dashboard** – Visualize productivity, habits, and progress
* 🌌 **Immersive UI** – Modern dark theme with dynamic 3D background

---

## ⚡ Key Highlights

* Full-stack SaaS-style application
* Secure authentication using JWT
* AI-powered insights using Google Gemini API
* Modular and scalable architecture
* Real-time data visualization
* Clean UI/UX with productivity-focused design

---

## 🧩 Core Modules

* Task Management System
* Habit Tracking Engine
* Goal Management (Kanban)
* Finance Tracking + AI Insights
* Study Tracking System
* Analytics Engine

---

## 🛠️ Tech Stack

### Frontend

* React 18 (Vite)
* Tailwind CSS / Modular CSS
* React Router DOM
* Recharts (Data Visualization)
* Three.js (3D UI Background)

### Backend

* Node.js + Express
* MongoDB + Mongoose
* JWT Authentication
* Bcrypt (Password Hashing)
* Google Gemini API (AI Insights)

---

## 🏗️ Architecture

* Frontend communicates with backend via REST APIs
* Backend handles authentication, business logic, and data processing
* MongoDB stores structured and indexed user data
* AI module processes financial insights using Gemini API

---

## 📁 Folder Structure

life-os/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── styles/
│   └── package.json
└── README.md

---

## 🚀 Setup & Installation

### Prerequisites

* Node.js (v18+)
* MongoDB Atlas
* Google Gemini API Key

### Backend Setup

cd backend
npm install

Create `.env` file:
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_key

Run server:
npm run dev

---

### Frontend Setup

cd frontend
npm install

Create `.env` file:
VITE_API_URL=http://localhost:5000

Run frontend:
npm run dev

---

## 🔐 Security

* JWT-based authentication
* Password hashing using bcrypt
* Protected API routes

---

## 🔮 Future Improvements

* Mobile App (PWA / React Native)
* Google Calendar Integration
* AI-based personalized recommendations
* Social accountability features

---

## 📸 Screenshots

(Add your real project screenshots here)

---

## 📄 License

This project is licensed under the MIT License.
