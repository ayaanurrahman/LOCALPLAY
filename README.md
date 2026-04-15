# LOCALPLAY

**A community-based platform to find nearby game partners for chess, badminton, carrom, cricket, and more.**

Live App: [localplay-three.vercel.app](https://localplay-three.vercel.app)  
API Docs: [localplay-backend.onrender.com/api-docs](https://localplay-backend.onrender.com/api-docs)

---

## What is LOCALPLAY?

LOCALPLAY solves a real problem — finding someone nearby to play a casual game with. Instead of relying on WhatsApp groups or word-of-mouth, users create a profile, pick the games they play and their skill level, set their availability, and immediately discover nearby players through a geospatial search. When they find someone, they send a play request with a proposed time and location. The other person accepts or declines. Notifications arrive in real time. After the match, both players can rate each other.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, MongoDB (Mongoose 9) |
| Real-time | Socket.io v4 |
| Auth | JWT (access + refresh tokens), httpOnly cookies |
| Email | Nodemailer (Mailtrap dev / SMTP prod) |
| 3D Background | Three.js |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Tests | Jest + Supertest + mongodb-memory-server |
| CI/CD | GitHub Actions → Render (backend) + Vercel (frontend) |

---

## Project Structure

```
LOCALPLAY/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.config.js      # MongoDB connection + sanitizeFilter
│   │   │   └── swagger.config.js       # OpenAPI spec definition
│   │   ├── controllers/
│   │   │   ├── auth.controller.js      # Register, login, logout, refresh, email verify
│   │   │   ├── user.controller.js      # Profile get/update, geospatial search
│   │   │   ├── playRequest.controller.js # Send/respond/cancel/history + notifications
│   │   │   ├── admin.controller.js     # User management, stats, flagging
│   │   │   ├── notification.controller.js # Get, mark read
│   │   │   └── rating.controller.js    # Submit rating, get ratings, check
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js      # JWT verify + silent refresh
│   │   │   └── admin.middleware.js     # Role check
│   │   ├── models/
│   │   │   ├── user.model.js           # User + 2dsphere index
│   │   │   ├── playRequest.model.js    # Partial unique index on pending
│   │   │   ├── rating.model.js         # One rating per player per match
│   │   │   ├── notification.model.js   # Per-user notification feed
│   │   │   └── refreshToken.model.js   # Hashed tokens + TTL expiry
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── playRequest.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── rating.routes.js
│   │   ├── tests/
│   │   │   ├── auth.test.js
│   │   │   ├── playRequest.test.js
│   │   │   └── setup.js                # mongodb-memory-server setup
│   │   ├── utils/
│   │   │   └── email.utils.js          # Nodemailer transporter + email templates
│   │   ├── app.js                      # Express app + middleware stack
│   │   └── socket.js                   # Socket.io init + room management
│   ├── server.js                       # HTTP server + Socket.io attachment
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── axios.ts               # Axios instance (baseURL + withCredentials)
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Nav + theme toggle + notification bell
│   │   │   ├── ProtectedRoute.tsx     # Redirects unauthenticated users
│   │   │   └── AdminRoute.tsx         # Redirects non-admin users
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # User state, login/logout, refreshUser
│   │   │   ├── ThemeContext.tsx       # Dark/light toggle, persisted in localStorage
│   │   │   └── SocketContext.tsx      # Socket connection + notification state
│   │   ├── routes/
│   │   │   ├── landing.tsx            # Three.js particle landing page
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx           # Game selector with per-game skill level
│   │   │   ├── profile.tsx            # Full profile editor + Nominatim location
│   │   │   ├── search.tsx             # Geospatial search + inline send request
│   │   │   ├── requests.tsx           # Incoming/outgoing/history + rating modal
│   │   │   ├── admin.tsx              # Stats, users, requests tabs
│   │   │   ├── verify-email.tsx       # Email verification landing
│   │   │   └── home.tsx               # Redirect to search
│   │   ├── root.tsx                   # App shell, AuthProvider, SocketProvider
│   │   ├── routes.ts                  # React Router v7 route config
│   │   └── app.css                    # CSS variables for full dark/light theme
│   └── package.json
│
└── .github/
    └── workflows/
        └── deploy.yml                 # CI: test → deploy backend + frontend in parallel
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local) or MongoDB Atlas account
- (Optional) Mailtrap account for email verification in development

### Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, and SMTP credentials in .env
npm run dev
```

Server runs on `http://localhost:3000`  
API docs available at `http://localhost:3000/api-docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`

---

## Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173

# Email (use Mailtrap for dev)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=no-reply@localplay.app
```

---

## Key Features

**Authentication**
- Register with email + password (strength enforced: 8+ chars, upper, lower, digit)
- Email verification via tokenised link (24h expiry)
- Access token (15 min) + refresh token (7 days, hashed in DB, rotated on use)
- Silent token refresh in middleware — users never get logged out unexpectedly
- Banned users blocked at middleware level

**Player Discovery**
- MongoDB `$near` geospatial query with `2dsphere` index
- Filter by game, skill level, day availability, time slot, and max distance (1–50km)
- Per-game skill levels — a user can be a chess beginner and badminton advanced simultaneously
- Paginated results (10 per page)

**Play Requests**
- Send with game, location (home/clubhouse/ground), proposed time, optional message
- Partial unique index prevents duplicate pending requests for the same game between the same two users
- Accept, decline, or cancel
- Email-verified users only can send requests

**Real-time Notifications**
- Socket.io with user-specific rooms
- Notifications on: request received, accepted, declined, cancelled
- Unread badge on navbar bell icon
- Persisted in MongoDB — notifications survive reconnects

**Ratings**
- Rate opponent after accepted match (after proposedTime passes)
- 1–5 stars + optional comment
- One rating per player per match (unique index)
- User avgRating and matchesPlayed auto-updated on submission

**Admin Dashboard**
- Platform stats (users, requests, success rate, popular games with bar chart)
- User management (ban/unban, delete with cascading request cleanup)
- All play requests with status filter and flagged indicator
- Flag requests for misuse with reason

**Theme**
- Full dark/light mode via CSS custom properties on `[data-theme]`
- Toggle in navbar, preference persisted in `localStorage`

---

## API Routes Summary

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
GET    /api/auth/verify/:token
POST   /api/auth/resend-verify

GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/search

POST   /api/requests/send
GET    /api/requests/incoming
GET    /api/requests/outgoing
GET    /api/requests/history
PUT    /api/requests/:id/respond
PUT    /api/requests/:id/cancel

GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

POST   /api/ratings
GET    /api/ratings/:userId
GET    /api/ratings/check/:playRequestId

GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id/ban
DELETE /api/admin/users/:id
GET    /api/admin/requests
GET    /api/admin/stats
POST   /api/admin/reports/:requestId
```

---

## Testing

```bash
cd backend
npm test
```

Uses `jest` + `supertest` + `mongodb-memory-server` — no real database needed. Tests cover auth (register, login, token behaviour) and play requests (send, respond, cancel, history).

---

## Deployment

The app is deployed as two separate services:

- **Backend** → Render (Node.js web service)
- **Frontend** → Vercel (static + SSR)

CI/CD is handled by GitHub Actions (`.github/workflows/deploy.yml`):  
On push to `main` → run tests → if passing, deploy backend to Render and frontend to Vercel in parallel.

---

## Internship Context

This project was built as an internship deliverable for Unified Mentor. The platform specification is based on the [playo.co](https://playo.co) concept — a community sports partner finder. The project was developed iteratively in two versions, with V2 adding real-time notifications, email verification, refresh token rotation, post-match ratings, automated tests, and a CI/CD pipeline on top of the V1 foundation.
[README.md](https://github.com/user-attachments/files/26741056/README.md)
