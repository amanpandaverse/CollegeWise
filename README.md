# 🎓 CollegeWise — Smart College Comparison & Career Guidance System

> **A full-stack higher education discovery and comparison platform engineered to help students find, evaluate, and shortlist institutions across India using verified metrics, multi-factor comparison matrices, and algorithmic guidance.**

*Made with Love ❤️ By - Aman Pushpakar & Team*

---

## 🌟 Highlights & Key Capabilities

- **🔍 Smart Multi-Filter Search**: Search across hundreds of colleges by city, state, course stream, annual tuition budget, and national rankings.
- **⚖️ 3-Way Side-by-Side Comparison Matrix**: Compare up to 3 colleges simultaneously across tuition fees, average packages, typical cut-offs, student ratings, and campus infrastructure.
- **🧠 Personalized Career Guidance Engine**: Weighted matching algorithm calculating real-time compatibility based on 12th board marks, entrance percentiles (JEE Main, CUET, NEET, etc.), stream preference, budget, and career ambitions (Corporate, Research, Startup).
- **📋 Student Shortlist & Dashboard**: Save favourite institutions, track application priorities, and view recommended matches.
- **🛡️ Administrative Control Suite**: Secure management interface for real-time CRUD operations on colleges, cut-off updates, placement records, and ranking revisions with audit logging.
- **⚡ Dual-Mode Deployment**: Serves as a standalone frontend (via VS Code Live Server) or a full-stack unified application with the Express server.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Flexbox & Grid, CSS Variables), Vanilla JavaScript (ES6+) |
| **Typography** | Google Fonts (*Plus Jakarta Sans*, *DM Sans*) |
| **Backend** | Node.js (v18+), Express.js framework |
| **Database** | SQLite3 via `better-sqlite3` (with WAL mode enabled) |
| **Authentication** | JSON Web Tokens (JWT) & `bcryptjs` password hashing |
| **Security & Middleware** | Role-Based Access Control (RBAC), CORS, Dotenv |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend UI Client                       │
│  - Semantic HTML5 Pages + Responsive CSS3                   │
│  - Dynamic DOM Rendering with Vanilla JS                    │
│  - Client-side State, Search/Filter, Local Fallback         │
└──────────────────────────────┬──────────────────────────────┘
                               │ RESTful APIs (JSON / JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express.js Application Server               │
│  - Port 5001 (Configurable via .env)                        │
│  - JWT Verification & Role Authorization Middleware         │
│  - Static Asset Hosting for Frontend                        │
│  - Recommendation Engine Business Logic                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Relational Database                │
│  - Users Table (Students & Administrators)                  │
│  - Colleges Table (NIRF Ranks, Fees, Placements, Cutoffs)   │
│  - Favourites Table (User-to-College Bookmarks)             │
│  - Activity Logs Table (System Audit Trails)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
CollegeWise/
├── index.html                  # Landing page (Hero, metrics, features, popular colleges)
├── about.html                  # About Us (Mission, workflow, full-stack architecture)
├── colleges.html               # College directory with multi-tier filters and sorting
├── college-details.html        # Detailed college profile & institutional statistics
├── compare.html                # 3-Way side-by-side comparative parameter table
├── recommendation.html         # Weighted career guidance recommendation engine
├── dashboard.html              # Student dashboard & shortlist summary
├── favourites.html             # Saved favourite colleges view
├── login.html                  # Unified student & admin login portal
├── register.html               # Student registration form
├── Project-Overview.md         # Comprehensive project documentation
│
├── css/
│   └── style.css               # Unified styling (responsive design system)
│
├── js/
│   └── app.js                  # Frontend client (API integration & local fallback)
│
├── admin/
│   ├── admin-dashboard.html    # Admin analytics metrics & live activity log
│   ├── admin-login.html        # Dedicated administrator authentication portal
│   ├── manage-colleges.html    # Full CRUD management for colleges
│   ├── manage-cutoffs.html     # Live cut-off percentage updater
│   ├── manage-placements.html  # Average package data updater
│   └── manage-rankings.html    # Institutional rankings updater
│
└── backend/
    ├── package.json            # Node dependencies & npm scripts
    ├── server.js               # Main Express entry point & static file server
    ├── .env                    # Environment configuration (Port 5001, JWT Secret)
    ├── config/
    │   └── db.js               # Database schema initialization & auto-seeder
    ├── middleware/
    │   └── auth.js             # JWT verification & role authorization
    ├── routes/
    │   ├── authRoutes.js       # Register, login, profile verification
    │   ├── collegeRoutes.js    # College queries, filters, and admin CRUD
    │   ├── compareRoutes.js    # Multi-college comparative matrix generator
    │   ├── recommendRoutes.js  # Weighted recommendation algorithm
    │   ├── favouriteRoutes.js  # Student shortlist persistence
    │   └── adminRoutes.js      # System analytics & audit log handlers
    └── data/
        └── collegewise.db      # SQLite relational database file
```



## 📡 REST API Summary

### Authentication
- `POST /api/auth/register` — Create student account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Verify authenticated profile

### Colleges & Directory
- `GET /api/colleges` — Search & filter (`?q=`, `?location=`, `?course=`, `?budget=`, `?sort=`)
- `GET /api/colleges/:id` — Single college profile
- `POST /api/colleges` — Add new college *(Admin)*
- `PUT /api/colleges/:id` — Update college info, cut-offs, placements *(Admin)*
- `DELETE /api/colleges/:id` — Remove college record *(Admin)*

### Comparison & Recommendation
- `GET /api/colleges/compare?ids=1,2,9` — 3-Way side-by-side comparison matrix
- `POST /api/recommendations` — Algorithmic recommendation engine

### Student Shortlists
- `GET /api/favourites` — Retrieve student's saved colleges
- `POST /api/favourites/toggle` — Add or remove a college from favourites

### Admin Analytics
- `GET /api/admin/stats` — Live system stats (Total colleges, users, uptime)
- `GET /api/admin/activity` — Administrative activity audit trail

---

## 📄 License & Attribution

Developed with Love ❤️ By **Aman Pushpakar & Team**  
*CollegeWise — Smart College Comparison and Career Guidance System*
