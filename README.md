<div align="center">

<img src="frontend/public/altawasul.png" alt="ALTAWASUL ALALAMI" width="140" />

# Mahmoud AlSherief — Digital Business Card

**CEO · ALTAWASUL ALALAMI**

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PM2](https://img.shields.io/badge/PM2-Production-2B037A?style=flat-square&logo=pm2&logoColor=white)](https://pm2.keymetrics.io)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat-square&logo=nginx&logoColor=white)](https://nginx.org)
[![License](https://img.shields.io/badge/License-Private-c9a227?style=flat-square)](#)

</div>

---

## Overview

A production-grade digital business card (vCard) platform for **Mahmoud AlSherief**, CEO of ALTAWASUL ALALAMI. Provides a luxury-designed public profile page with full contact information, social links, and a one-tap vCard download — alongside a secure admin dashboard for managing all content.

The interface features an Islamic geometric pattern background, neumorphic card design, gold shimmer animations, and full Arabic / English bilingual support with RTL layout.

---

## Features

**Public Card**
- Luxury profile card with neumorphic design and animated Islamic geometric background
- One-tap `.vcf` contact download (vCard 3.0)
- Bilingual interface — Arabic (RTL) and English (LTR)
- Dark / Light theme toggle with persistent preference
- Responsive, mobile-first layout (max-width 430px)
- Social and contact links with type-aware icons and gold beam hover animation
- Office locations display

**Admin Dashboard**
- JWT-authenticated admin panel
- Full CRUD for profile data (name, title, company, phone, email, website, address)
- Cover image and profile image upload
- Manage contact links (add, reorder, delete)
- Live preview of changes

**Infrastructure**
- Express.js REST API with Helmet security headers
- SQLite database (zero-config, file-based)
- PM2 process management with auto-restart
- Nginx reverse proxy with static file caching
- Let's Encrypt SSL (auto-renewal)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| UI Icons | Lucide React |
| Fonts | Playfair Display, Syne, IBM Plex Mono, Tajawal |
| Backend | Node.js 20, Express.js 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |
| Security | Helmet, CORS, bcrypt password hashing |
| Process | PM2 |
| Web Server | Nginx |
| SSL | Let's Encrypt (Certbot) |

---

## Project Structure

```
.
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js              # POST /api/auth/login
│   │   ├── auth.test.js
│   │   ├── vcard.js             # GET|PUT /api/vcard  +  links CRUD
│   │   └── vcard.test.js
│   ├── uploads/                 # Uploaded images (gitignored)
│   ├── db.js                    # SQLite schema + seed
│   ├── server.js                # Express entry point
│   ├── ecosystem.config.js      # PM2 config
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── altawasul.png        # Favicon / logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── LinkCard.jsx     # Individual link row
│   │   │   └── LoadingScreen.jsx
│   │   ├── hooks/
│   │   │   └── useVCard.js      # Data fetching hook
│   │   ├── pages/
│   │   │   ├── PublicCard.jsx   # Public profile page
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── index.css            # Design system + Islamic pattern CSS
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── DEPLOY.md                    # VPS deployment guide
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 20 LTS
- npm 10+

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/KINGMAN8888/Mahmoud_AlSherief_Info.git
cd Mahmoud_AlSherief_Info

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Install frontend dependencies
cd ../frontend
npm install
```

### Run in development

```bash
# Terminal 1 — Backend API (port 3000)
cd backend
node server.js

# Terminal 2 — Frontend dev server (port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` for the public card.
Open `http://localhost:5173/admin` for the admin panel.

---

## Environment Variables

Create `backend/.env` based on `.env.example`:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=<64-byte hex string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
CORS_ORIGIN=https://ceo.altawasul-alalami.com
```

Generate a secure `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Production Deployment

Full step-by-step instructions for Hostinger VPS deployment are in [`DEPLOY.md`](./DEPLOY.md).

**Summary:**

```bash
# 1. Build frontend locally
cd frontend && npm run build

# 2. Upload to VPS
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='*.db' \
  ./backend/ root@VPS_IP:/var/www/vcard/backend/
rsync -avz ./frontend/dist/ root@VPS_IP:/var/www/vcard/frontend/dist/

# 3. On the VPS
cd /var/www/vcard/backend
npm install --omit=dev
pm2 start ecosystem.config.js && pm2 save
```

Live at: **[https://ceo.altawasul-alalami.com](https://ceo.altawasul-alalami.com)**

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/vcard/public` | — | Fetch public profile data |
| `POST` | `/api/auth/login` | — | Admin login, returns JWT |
| `GET` | `/api/vcard` | JWT | Fetch full profile (admin) |
| `PUT` | `/api/vcard` | JWT | Update profile fields |
| `POST` | `/api/vcard/upload` | JWT | Upload cover / profile image |
| `GET` | `/api/vcard/links` | JWT | List all links |
| `POST` | `/api/vcard/links` | JWT | Add a new link |
| `PUT` | `/api/vcard/links/:id` | JWT | Update a link |
| `DELETE` | `/api/vcard/links/:id` | JWT | Delete a link |

---

## Security

- All admin routes are protected by JWT bearer token authentication
- Passwords are hashed with bcrypt (cost factor 12)
- HTTP security headers via Helmet
- File upload validation — images only, 5 MB limit
- CORS restricted to the configured origin
- Environment variables never committed to version control
- SQLite database file excluded from git

---

## Update Workflow

```bash
# Frontend only (no server restart needed)
cd frontend && npm run build
rsync -avz ./frontend/dist/ root@VPS_IP:/var/www/vcard/frontend/dist/

# Backend only
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='*.db' \
  ./backend/ root@VPS_IP:/var/www/vcard/backend/
ssh root@VPS_IP "cd /var/www/vcard/backend && npm install --omit=dev && pm2 restart vcard"
```

---

<div align="center">

[![Website](https://img.shields.io/badge/Live_Site-ceo.altawasul--alalami.com-c9a227?style=flat-square&logo=google-chrome&logoColor=white)](https://ceo.altawasul-alalami.com)

**ALTAWASUL ALALAMI — شركة التواصل العالمي**

</div>
