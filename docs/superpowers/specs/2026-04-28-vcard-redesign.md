# vCard Professional Redesign — Design Spec

**Date:** 2026-04-28  
**Project:** Mahmoud Alsherief Digital vCard  
**Stack:** React + Vite + Node.js + Express + SQLite  

---

## 1. Goals

- Remove Firebase entirely — replace with a self-hosted backend on VPS
- Local SQLite database — no third-party cloud dependency
- Professional luxury design (dark + gold) with smooth animations
- Password-protected `/admin` panel for editing all vCard data
- Single deployable unit: Express serves the built React app
- Profile image upload stored locally on the server

---

## 2. Project Structure

```
vcard/
├── backend/
│   ├── server.js             # Express entry point
│   ├── db.js                 # SQLite setup + seed
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/login
│   │   └── vcard.js          # GET/PUT /api/vcard, POST /api/upload
│   ├── uploads/              # Stored profile images
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PublicCard.jsx   # Public-facing vCard
│   │   │   └── Admin.jsx        # Admin dashboard (login + edit)
│   │   ├── components/
│   │   │   ├── LinkCard.jsx     # Single link button component
│   │   │   ├── SectionDivider.jsx
│   │   │   └── LoadingScreen.jsx
│   │   ├── hooks/
│   │   │   └── useVCard.js      # Data fetching hook
│   │   ├── App.jsx              # Router (/ and /admin)
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── package.json              # Root: build + start scripts
```

---

## 3. Database Schema (SQLite)

### Table: `vcard`

| Column         | Type    | Notes                        |
|----------------|---------|------------------------------|
| id             | INTEGER | PRIMARY KEY (always 1)       |
| name           | TEXT    | Full name                    |
| title          | TEXT    | Job title                    |
| company        | TEXT    | Company name                 |
| phone          | TEXT    | E.164 format                 |
| display_phone  | TEXT    | Formatted display            |
| email          | TEXT    |                              |
| website        | TEXT    |                              |
| address        | TEXT    |                              |
| locations      | TEXT    | Comma-separated locations    |
| profile_image  | TEXT    | URL or /uploads/filename     |
| cover_image    | TEXT    | URL or /uploads/filename     |

### Table: `links`

| Column  | Type    | Notes                        |
|---------|---------|------------------------------|
| id      | INTEGER | PRIMARY KEY AUTOINCREMENT    |
| sort    | INTEGER | Display order                |
| title   | TEXT    | Arabic label                 |
| type    | TEXT    | phone/whatsapp/email/etc     |
| url     | TEXT    | Full URL                     |
| icon    | TEXT    | Lucide icon name             |

### Table: `admin`

| Column        | Type | Notes              |
|---------------|------|--------------------|
| id            | INT  | PRIMARY KEY (1)    |
| username      | TEXT |                    |
| password_hash | TEXT | bcrypt             |

---

## 4. API Endpoints

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| GET    | /api/vcard            | No   | Get full vCard data      |
| PUT    | /api/vcard            | JWT  | Update vCard + links     |
| POST   | /api/auth/login       | No   | Returns JWT token        |
| POST   | /api/upload           | JWT  | Upload profile/cover img |

---

## 5. Authentication

- Single admin user seeded at startup (default: admin / changeme123)
- POST /api/auth/login returns a signed JWT (24h expiry)
- Token stored in localStorage on frontend
- All write routes protected by `auth.js` middleware
- Admin forces password change on first login (optional v2)

---

## 6. Frontend Pages

### PublicCard (`/`)

- Full-screen luxury dark card (max-w-md centered)
- Cover image with gradient overlay
- Circular profile photo with gold ring
- Name, title, company
- Action row: [Save Contact] [Share]
- Scrollable link buttons with icons
- Animated entrance (fade + slide up)
- Download vCard (.vcf) functionality
- Web Share API with clipboard fallback

### Admin (`/admin`)

- Login screen: username + password form
- On success: JWT saved, redirect to dashboard
- Dashboard sections:
  - Basic info (name, title, company, phone, email, website, address, locations)
  - Images (profile + cover — URL or upload)
  - Links manager (add, edit, reorder, delete)
  - Save button → PUT /api/vcard
  - Logout button

---

## 7. Design System

| Token          | Value                |
|----------------|----------------------|
| Background     | #0a0a0a              |
| Card bg        | #161616              |
| Surface        | #1e1e1e              |
| Border         | #2a2a2a              |
| Gold primary   | #d4af37              |
| Gold hover     | #e5c158              |
| Text primary   | #f0f0f0              |
| Text muted     | #888888              |
| Font           | Inter (latin) + Tajawal (Arabic) |

Animations: fade-in on load, scale on hover for buttons, slide-up for sections.

---

## 8. Deployment (VPS)

```bash
# Install
cd backend && npm install
cd ../frontend && npm install && npm run build

# Start (from root)
node backend/server.js
# Express serves /frontend/dist as static + API on same port (3000)
```

- Use PM2 for process management
- Nginx reverse proxy on port 80/443
- `.env` file for JWT_SECRET and ADMIN_PASSWORD

---

## 9. Out of Scope (v1)

- Multiple vCard profiles
- Analytics / visit tracking
- Email notifications
- Two-factor authentication
