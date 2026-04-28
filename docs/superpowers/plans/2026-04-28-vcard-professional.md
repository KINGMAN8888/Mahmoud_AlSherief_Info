# vCard Professional Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Firebase with a self-hosted Express + SQLite backend and rebuild the frontend as a professional luxury vCard with a password-protected admin panel.

**Architecture:** Express serves both the REST API (`/api/*`) and the built React app as static files from a single process. SQLite stores all vCard data locally on the VPS. React Router handles `/` (public card) and `/admin` (protected dashboard).

**Tech Stack:** Node.js 18+, Express 4, better-sqlite3, bcryptjs, jsonwebtoken, React 19, Vite, Tailwind CSS v4, Lucide React, React Router DOM v6.

---

## File Map

```
f:/Dashboard my father/
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── server.js              # Express entry — mounts routes, serves static
│   ├── db.js                  # SQLite init, schema creation, seed data
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   └── routes/
│       ├── auth.js            # POST /api/auth/login
│       └── vcard.js           # GET /api/vcard, PUT /api/vcard, POST /api/upload
│
├── frontend/                  # Replaces my-vcard/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js         # Dev proxy to backend :3000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # BrowserRouter + routes
│       ├── index.css          # Tailwind + custom fonts + animations
│       ├── hooks/
│       │   └── useVCard.js    # Fetch vCard data from API
│       ├── components/
│       │   ├── LinkCard.jsx       # Single link button
│       │   └── LoadingScreen.jsx  # Gold spinner
│       └── pages/
│           ├── PublicCard.jsx     # Public-facing card
│           └── Admin.jsx          # Login + dashboard
│
└── package.json               # Root: scripts to build frontend + start backend
```

---

### Task 1: Root and Backend scaffold

**Files:**

- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `package.json` (root)

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "vcard-professional",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "cd frontend && npm install && npm run build",
    "start": "node backend/server.js",
    "dev:backend": "node --watch backend/server.js",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

- [ ] **Step 2: Create backend/package.json**

```json
{
  "name": "vcard-backend",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 3: Create backend/.env.example**

```
PORT=3000
JWT_SECRET=change_this_to_a_long_random_string_in_production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123
```

- [ ] **Step 4: Install backend dependencies**

```bash
cd "f:/Dashboard my father/backend" && npm install
```

Expected: `node_modules` created, no errors.

- [ ] **Step 5: Commit**

```bash
cd "f:/Dashboard my father"
git init
git add backend/package.json backend/.env.example package.json
git commit -m "chore: scaffold backend and root package"
```

---

### Task 2: Database setup

**Files:**

- Create: `backend/db.js`

- [ ] **Step 1: Write failing test**

Create `backend/db.test.js`:

```js
const { getDb, closeDb } = require('./db');

beforeEach(() => {
  // Use in-memory DB for tests
  process.env.DB_PATH = ':memory:';
});

afterEach(() => closeDb());

test('vcard table has exactly one row after init', () => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as c FROM vcard').get();
  expect(row.c).toBe(1);
});

test('links table has 5 default rows after init', () => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as c FROM links').get();
  expect(row.c).toBe(5);
});

test('admin table has one user after init', () => {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as c FROM admin').get();
  expect(row.c).toBe(1);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "f:/Dashboard my father/backend" && npx jest db.test.js
```

Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 3: Implement db.js**

```js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

let _db = null;

function getDb() {
  if (_db) return _db;
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'vcard.db');
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function closeDb() {
  if (_db) { _db.close(); _db = null; }
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vcard (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      name          TEXT NOT NULL DEFAULT '',
      title         TEXT NOT NULL DEFAULT '',
      company       TEXT NOT NULL DEFAULT '',
      phone         TEXT NOT NULL DEFAULT '',
      display_phone TEXT NOT NULL DEFAULT '',
      email         TEXT NOT NULL DEFAULT '',
      website       TEXT NOT NULL DEFAULT '',
      address       TEXT NOT NULL DEFAULT '',
      locations     TEXT NOT NULL DEFAULT '',
      profile_image TEXT NOT NULL DEFAULT '',
      cover_image   TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS links (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      sort  INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL DEFAULT '',
      type  TEXT NOT NULL DEFAULT 'link',
      url   TEXT NOT NULL DEFAULT '',
      icon  TEXT NOT NULL DEFAULT 'Globe'
    );

    CREATE TABLE IF NOT EXISTS admin (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );
  `);

  // Seed vcard if empty
  const hasVcard = db.prepare('SELECT id FROM vcard WHERE id = 1').get();
  if (!hasVcard) {
    db.prepare(`
      INSERT INTO vcard (id, name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Mahmoud Alsherief',
      'CEO',
      'ALTAWASUL ALALAMI & AlMedyaf Almasi',
      '+966536413795',
      '+966-53-641-3795',
      'ceo@altawasul-alalami.com',
      'https://www.altawasul-alalami.com',
      'Third Ring Road Branch, 2974, Makkah Al-Mukarramah, Al-Khalidiyah District, Saudi Arabia, 24243',
      'Mecca - Medina - Indonesia - Malaysia - Egypt',
      'https://placehold.co/400x400/1a1a1a/d4af37?text=MA',
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop'
    );
  }

  // Seed links if empty
  const hasLinks = db.prepare('SELECT id FROM links LIMIT 1').get();
  if (!hasLinks) {
    const insertLink = db.prepare('INSERT INTO links (sort, title, type, url, icon) VALUES (?, ?, ?, ?, ?)');
    const seedLinks = [
      [1, 'اتصال هاتفي', 'phone', 'tel:+966536413795', 'Phone'],
      [2, 'محادثة واتساب', 'whatsapp', 'https://wa.me/966536413795', 'MessageCircle'],
      [3, 'البريد الإلكتروني', 'email', 'mailto:ceo@altawasul-alalami.com', 'Mail'],
      [4, 'الموقع الإلكتروني', 'website', 'https://www.altawasul-alalami.com', 'Globe'],
      [5, 'موقع المكتب', 'map', 'https://maps.google.com/?q=2974,Makkah', 'MapPin'],
    ];
    seedLinks.forEach(l => insertLink.run(...l));
  }

  // Seed admin if empty
  const hasAdmin = db.prepare('SELECT id FROM admin WHERE id = 1').get();
  if (!hasAdmin) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'changeme123';
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admin (id, username, password_hash) VALUES (1, ?, ?)').run(username, hash);
  }
}

module.exports = { getDb, closeDb };
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd "f:/Dashboard my father/backend" && npx jest db.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd "f:/Dashboard my father"
git add backend/db.js backend/db.test.js
git commit -m "feat: SQLite database schema and seed data"
```

---

### Task 3: Auth middleware and login route

**Files:**

- Create: `backend/middleware/auth.js`
- Create: `backend/routes/auth.js`

- [ ] **Step 1: Write failing test**

Create `backend/routes/auth.test.js`:

```js
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'testpass';

const request = require('supertest');
const express = require('express');
const authRouter = require('./auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

afterAll(() => require('../db').closeDb());

test('POST /api/auth/login with correct credentials returns token', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'testpass' });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('token');
});

test('POST /api/auth/login with wrong password returns 401', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
  expect(res.status).toBe(401);
});

test('POST /api/auth/login with missing fields returns 400', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "f:/Dashboard my father/backend" && npx jest auth.test.js
```

Expected: FAIL — `Cannot find module './auth'`

- [ ] **Step 3: Implement middleware/auth.js**

```js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

- [ ] **Step 4: Implement routes/auth.js**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = getDb().prepare('SELECT * FROM admin WHERE id = 1').get();
  if (!admin || admin.username !== username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '24h' }
  );

  res.json({ token });
});

module.exports = router;
```

- [ ] **Step 5: Run test — verify it passes**

```bash
cd "f:/Dashboard my father/backend" && npx jest auth.test.js
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd "f:/Dashboard my father"
git add backend/middleware/auth.js backend/routes/auth.js backend/routes/auth.test.js
git commit -m "feat: JWT auth middleware and login endpoint"
```

---

### Task 4: vCard API routes

**Files:**

- Create: `backend/routes/vcard.js`
- Create: `backend/uploads/` (directory)

- [ ] **Step 1: Write failing test**

Create `backend/routes/vcard.test.js`:

```js
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'testpass';

const request = require('supertest');
const express = require('express');
const vcardRouter = require('./vcard');
const authRouter = require('./auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/vcard', vcardRouter);

let token;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'testpass' });
  token = res.body.token;
});

afterAll(() => require('../db').closeDb());

test('GET /api/vcard returns vcard data with links array', async () => {
  const res = await request(app).get('/api/vcard');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('name', 'Mahmoud Alsherief');
  expect(Array.isArray(res.body.links)).toBe(true);
  expect(res.body.links.length).toBe(5);
});

test('PUT /api/vcard without token returns 401', async () => {
  const res = await request(app).put('/api/vcard').send({ name: 'Test' });
  expect(res.status).toBe(401);
});

test('PUT /api/vcard with token updates name', async () => {
  const current = (await request(app).get('/api/vcard')).body;
  const updated = { ...current, name: 'Updated Name' };
  const res = await request(app)
    .put('/api/vcard')
    .set('Authorization', `Bearer ${token}`)
    .send(updated);
  expect(res.status).toBe(200);
  const verify = await request(app).get('/api/vcard');
  expect(verify.body.name).toBe('Updated Name');
});

test('PUT /api/vcard with token updates links', async () => {
  const current = (await request(app).get('/api/vcard')).body;
  const updated = {
    ...current,
    links: [
      { sort: 1, title: 'Test Link', type: 'link', url: 'https://test.com', icon: 'Globe' }
    ]
  };
  const res = await request(app)
    .put('/api/vcard')
    .set('Authorization', `Bearer ${token}`)
    .send(updated);
  expect(res.status).toBe(200);
  const verify = await request(app).get('/api/vcard');
  expect(verify.body.links).toHaveLength(1);
  expect(verify.body.links[0].title).toBe('Test Link');
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd "f:/Dashboard my father/backend" && npx jest vcard.test.js
```

Expected: FAIL — `Cannot find module './vcard'`

- [ ] **Step 3: Create uploads directory**

```bash
mkdir -p "f:/Dashboard my father/backend/uploads"
```

- [ ] **Step 4: Implement routes/vcard.js**

```js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/vcard — public
router.get('/', (req, res) => {
  const db = getDb();
  const vcard = db.prepare('SELECT * FROM vcard WHERE id = 1').get();
  const links = db.prepare('SELECT * FROM links ORDER BY sort ASC').all();
  res.json({ ...vcard, links });
});

// PUT /api/vcard — protected
router.put('/', auth, (req, res) => {
  const db = getDb();
  const {
    name, title, company, phone, display_phone,
    email, website, address, locations,
    profile_image, cover_image, links = []
  } = req.body;

  db.prepare(`
    UPDATE vcard SET
      name = ?, title = ?, company = ?, phone = ?, display_phone = ?,
      email = ?, website = ?, address = ?, locations = ?,
      profile_image = ?, cover_image = ?
    WHERE id = 1
  `).run(name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image);

  // Replace all links
  db.prepare('DELETE FROM links').run();
  const insertLink = db.prepare('INSERT INTO links (sort, title, type, url, icon) VALUES (?, ?, ?, ?, ?)');
  links.forEach((link, i) => {
    insertLink.run(link.sort ?? i, link.title, link.type, link.url, link.icon);
  });

  res.json({ ok: true });
});

// POST /api/upload — protected
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
```

- [ ] **Step 5: Run test — verify it passes**

```bash
cd "f:/Dashboard my father/backend" && npx jest vcard.test.js
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
cd "f:/Dashboard my father"
git add backend/routes/vcard.js backend/routes/vcard.test.js
git commit -m "feat: vCard GET/PUT API and image upload endpoint"
```

---

### Task 5: Express server entry point

**Files:**

- Create: `backend/server.js`

- [ ] **Step 1: Create backend/server.js**

```js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Static: uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vcard', require('./routes/vcard'));

// Static: serve built React app (production)
const distPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Init DB on startup
getDb();

app.listen(PORT, () => {
  console.log(`vCard server running on http://localhost:${PORT}`);
});

module.exports = app;
```

- [ ] **Step 2: Create backend/.env from example**

```bash
cp "f:/Dashboard my father/backend/.env.example" "f:/Dashboard my father/backend/.env"
```

- [ ] **Step 3: Start server to verify it runs**

```bash
cd "f:/Dashboard my father/backend" && node server.js
```

Expected output: `vCard server running on http://localhost:3000`

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
cd "f:/Dashboard my father"
git add backend/server.js backend/.env.example
git commit -m "feat: Express server entry point"
```

---

### Task 6: Frontend scaffold and routing

**Files:**

- Create: `frontend/` (new directory replacing my-vcard)
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "vcard-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.469.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.5"
  }
}
```

- [ ] **Step 2: Create frontend/index.html**

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mahmoud Alsherief — CEO</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create frontend/vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 4: Create frontend/src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Create frontend/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicCard from './pages/PublicCard.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicCard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Install frontend dependencies**

```bash
cd "f:/Dashboard my father/frontend" && npm install
```

Expected: `node_modules` created, no errors.

- [ ] **Step 7: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/package.json frontend/index.html frontend/vite.config.js frontend/src/main.jsx frontend/src/App.jsx
git commit -m "feat: frontend scaffold with React Router"
```

---

### Task 7: Global CSS and design tokens

**Files:**

- Create: `frontend/src/index.css`

- [ ] **Step 1: Create frontend/src/index.css**

```css
@import "tailwindcss";

:root {
  --gold: #d4af37;
  --gold-hover: #e5c158;
  --gold-dim: rgba(212, 175, 55, 0.15);
  --bg-base: #0a0a0a;
  --bg-card: #161616;
  --bg-surface: #1e1e1e;
  --border: #2a2a2a;
  --text-primary: #f0f0f0;
  --text-muted: #888888;
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Tajawal', 'Inter', sans-serif;
  margin: 0;
  -webkit-tap-highlight-color: transparent;
}

::selection {
  background: var(--gold);
  color: #000;
}

/* Scroll bar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes spinGold {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.animate-fade-up {
  animation: fadeUp 0.6s ease forwards;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease forwards;
}

.animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
.animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
.animate-delay-3 { animation-delay: 0.3s; opacity: 0; }
.animate-delay-4 { animation-delay: 0.4s; opacity: 0; }
.animate-delay-5 { animation-delay: 0.5s; opacity: 0; }

.gold-shimmer {
  background: linear-gradient(90deg, var(--gold) 0%, var(--gold-hover) 50%, var(--gold) 100%);
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glass-card {
  background: rgba(22, 22, 22, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

- [ ] **Step 2: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/index.css
git commit -m "feat: global CSS design tokens and animations"
```

---

### Task 8: Shared components

**Files:**

- Create: `frontend/src/components/LoadingScreen.jsx`
- Create: `frontend/src/components/LinkCard.jsx`
- Create: `frontend/src/hooks/useVCard.js`

- [ ] **Step 1: Create LoadingScreen.jsx**

```jsx
export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-transparent"
           style={{
             borderTopColor: 'var(--gold)',
             borderRightColor: 'var(--gold)',
             animation: 'spinGold 0.8s linear infinite'
           }} />
      <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
    </div>
  );
}
```

- [ ] **Step 2: Create LinkCard.jsx**

```jsx
import { Phone, MessageCircle, Mail, Globe, MapPin, Briefcase, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const ICONS = { Phone, MessageCircle, Mail, Globe, MapPin, Briefcase, Instagram, Twitter, Linkedin, Youtube };

export default function LinkCard({ link, index }) {
  const Icon = ICONS[link.icon] || Globe;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-95 animate-fade-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,175,55,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--gold)' }}>
        <Icon size={20} />
      </div>
      <span className="flex-1 text-right font-medium transition-colors duration-200"
            style={{ color: 'var(--text-primary)', fontFamily: 'Tajawal, sans-serif' }}>
        {link.title}
      </span>
      <svg className="w-4 h-4 flex-shrink-0 transition-colors duration-200 rotate-180"
           style={{ color: 'var(--text-muted)' }}
           fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
```

- [ ] **Step 3: Create hooks/useVCard.js**

```js
import { useState, useEffect } from 'react';

export function useVCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/vcard')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch');
        return r.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

- [ ] **Step 4: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/components/ frontend/src/hooks/
git commit -m "feat: shared components and useVCard hook"
```

---

### Task 9: Public vCard page

**Files:**

- Create: `frontend/src/pages/PublicCard.jsx`

- [ ] **Step 1: Create PublicCard.jsx**

```jsx
import { Download, Share2, Plane } from 'lucide-react';
import { useVCard } from '../hooks/useVCard.js';
import LinkCard from '../components/LinkCard.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

function downloadVcf(data) {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN;CHARSET=UTF-8:${data.name}`,
    `N;CHARSET=UTF-8:${data.name};;;;`,
    `TITLE;CHARSET=UTF-8:${data.title}`,
    `ORG;CHARSET=UTF-8:${data.company}`,
    `TEL;TYPE=WORK,VOICE:${data.phone}`,
    `EMAIL;TYPE=WORK:${data.email}`,
    `URL:${data.website}`,
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;${data.address}`,
    `NOTE;CHARSET=UTF-8:${data.locations}`,
    'END:VCARD',
  ].join('\n');
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.replace(/\s+/g, '_')}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareProfile(data) {
  if (navigator.share) {
    try {
      await navigator.share({ title: `${data.name} — ${data.title}`, url: window.location.href });
    } catch {}
  } else {
    await navigator.clipboard.writeText(window.location.href);
  }
}

export default function PublicCard() {
  const { data, loading } = useVCard();

  if (loading) return <LoadingScreen />;
  if (!data) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}
         className="flex justify-center">
      <div className="w-full max-w-md relative"
           style={{ background: 'var(--bg-card)', minHeight: '100vh', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>

        {/* Radial glow top */}
        <div className="absolute top-0 left-0 w-full h-72 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />

        {/* Cover image */}
        <div className="relative h-52 overflow-hidden">
          <img src={data.cover_image} alt="cover"
               className="w-full h-full object-cover"
               style={{ opacity: 0.5, mixBlendMode: 'luminosity' }} />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to bottom, transparent 20%, var(--bg-card) 100%)' }} />
          {/* Watermark */}
          <div className="absolute top-5 right-5 flex items-center gap-2" style={{ opacity: 0.25 }}>
            <Plane size={28} style={{ color: 'var(--gold)', transform: 'rotate(45deg)' }} />
            <span style={{ color: 'var(--gold)', fontFamily: 'serif', fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>7</span>
          </div>
        </div>

        {/* Profile section */}
        <div className="px-6 -mt-20 relative z-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full overflow-hidden mb-5 animate-fade-in"
               style={{
                 border: '4px solid var(--bg-card)',
                 boxShadow: '0 0 0 2px var(--gold), 0 8px 32px rgba(212,175,55,0.25)'
               }}>
            <img src={data.profile_image} alt={data.name} className="w-full h-full object-cover" />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold mb-1 animate-fade-up animate-delay-1"
              style={{ color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
            {data.name}
          </h1>

          {/* Title */}
          <p className="text-xs font-semibold tracking-widest uppercase mb-3 animate-fade-up animate-delay-2 gold-shimmer">
            {data.title}
          </p>

          {/* Company */}
          <p className="text-sm mb-6 animate-fade-up animate-delay-3"
             style={{ color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.6 }}>
            {data.company}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 w-full mb-8 animate-fade-up animate-delay-4">
            <button
              onClick={() => downloadVcf(data)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--gold) 0%, #b38f21 100%)',
                color: '#000',
                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                fontFamily: 'Tajawal, sans-serif',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <Download size={18} />
              حفظ جهة الاتصال
            </button>
            <button
              onClick={() => shareProfile(data)}
              className="flex items-center justify-center p-3 rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                color: 'var(--gold)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 mb-6 animate-fade-up animate-delay-4"
             style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

        {/* Links */}
        <div className="px-6 space-y-3 pb-10">
          {data.links.map((link, i) => (
            <LinkCard key={link.id} link={link} index={i} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-10 text-center" dir="rtl">
          <div className="mb-3 flex justify-center">
            <Plane size={20} style={{ color: 'var(--border)', transform: 'rotate(45deg)' }} />
          </div>
          <p className="text-xs tracking-widest uppercase mb-2"
             style={{ color: '#444', fontFamily: 'Inter, sans-serif' }}>
            {data.locations}
          </p>
          <p className="text-xs leading-relaxed mx-auto max-w-xs"
             style={{ color: '#333' }}>
            {data.address}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/pages/PublicCard.jsx
git commit -m "feat: public vCard page with luxury design"
```

---

### Task 10: Admin panel (login + dashboard)

**Files:**

- Create: `frontend/src/pages/Admin.jsx`

- [ ] **Step 1: Create Admin.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Save, LogOut, Plus, Trash2, LogIn, Eye, EyeOff, Upload } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen.jsx';

const ICON_OPTIONS = ['Phone', 'MessageCircle', 'Mail', 'Globe', 'MapPin', 'Briefcase', 'Instagram', 'Twitter', 'Linkedin', 'Youtube'];

function getToken() { return localStorage.getItem('vcard_token'); }
function setToken(t) { localStorage.setItem('vcard_token', t); }
function clearToken() { localStorage.removeItem('vcard_token'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

// ─── Login screen ─────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm animate-fade-up"
           style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32 }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <LogIn size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>لوحة التحكم</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>تسجيل الدخول للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>اسم المستخدم</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl outline-none text-right transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Inter' }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 pr-11 rounded-xl outline-none text-right transition-colors"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Inter' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center py-2 px-3 rounded-lg"
               style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 mt-2"
            style={{
              background: 'linear-gradient(135deg, var(--gold), #b38f21)',
              color: '#000',
              fontFamily: 'Tajawal',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Field component ─────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Tajawal' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: 10,
  padding: '10px 12px',
  width: '100%',
  outline: 'none',
  fontFamily: 'Tajawal, Inter, sans-serif',
  fontSize: 14,
};

// ─── Dashboard ─────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => {
    apiFetch('/api/vcard').then(setData).catch(console.error);
  }, []);

  if (!data) return <LoadingScreen />;

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const setLink = (id, key, val) =>
    setData(prev => ({ ...prev, links: prev.links.map(l => l.id === id ? { ...l, [key]: val } : l) }));

  const addLink = () =>
    setData(prev => ({
      ...prev,
      links: [...prev.links, { id: Date.now(), sort: prev.links.length + 1, title: 'رابط جديد', type: 'link', url: 'https://', icon: 'Globe' }]
    }));

  const removeLink = id =>
    setData(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/api/vcard', { method: 'PUT', body: JSON.stringify(data) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (field, file) => {
    setUploadingField(field);
    try {
      const form = new FormData();
      form.append('file', file);
      const { url } = await apiFetch('/api/vcard/upload', { method: 'POST', body: form });
      set(field, url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingField(null);
    }
  };

  const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '0 0 80px' }} dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
           style={{ background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-base font-bold" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>لوحة التحكم</h1>
        <button onClick={() => { clearToken(); onLogout(); }}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          <LogOut size={14} />
          خروج
        </button>
      </div>

      <div className="px-4 pt-4 max-w-md mx-auto">
        {/* Basic Info */}
        <div style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>المعلومات الأساسية</h2>
          <div className="space-y-3">
            <Field label="الاسم الكامل">
              <input value={data.name} onChange={e => set('name', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="المسمى الوظيفي">
              <input value={data.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="الشركة">
              <input value={data.company} onChange={e => set('company', e.target.value)} style={inputStyle} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="رقم الهاتف (للروابط)">
                <input value={data.phone} onChange={e => set('phone', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
              </Field>
              <Field label="رقم العرض">
                <input value={data.display_phone} onChange={e => set('display_phone', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
              </Field>
            </div>
            <Field label="البريد الإلكتروني">
              <input value={data.email} onChange={e => set('email', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
            </Field>
            <Field label="الموقع الإلكتروني">
              <input value={data.website} onChange={e => set('website', e.target.value)} style={{ ...inputStyle, direction: 'ltr' }} />
            </Field>
            <Field label="العنوان">
              <textarea value={data.address} onChange={e => set('address', e.target.value)}
                        rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="مواقع الفروع">
              <input value={data.locations} onChange={e => set('locations', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Images */}
        <div style={sectionStyle}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>الصور</h2>
          <div className="space-y-4">
            {[
              { label: 'صورة الملف الشخصي', field: 'profile_image' },
              { label: 'صورة الغلاف', field: 'cover_image' },
            ].map(({ label, field }) => (
              <Field key={field} label={label}>
                <div className="flex gap-2">
                  <input
                    value={data[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder="https://..."
                    style={{ ...inputStyle, direction: 'ltr', flex: 1 }}
                  />
                  <label className="flex items-center justify-center px-3 rounded-xl cursor-pointer transition-colors"
                         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: uploadingField === field ? 'var(--gold)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {uploadingField === field ? '...' : <Upload size={16} />}
                    <input type="file" accept="image/*" className="hidden"
                           onChange={e => e.target.files[0] && handleUpload(field, e.target.files[0])} />
                  </label>
                </div>
                {data[field] && (
                  <img src={data[field]} alt={label} className="mt-2 rounded-xl object-cover"
                       style={{ height: 80, width: '100%', border: '1px solid var(--border)' }} />
                )}
              </Field>
            ))}
          </div>
        </div>

        {/* Links */}
        <div style={sectionStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--gold)', fontFamily: 'Tajawal' }}>الروابط</h2>
            <button onClick={addLink}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Plus size={13} /> إضافة
            </button>
          </div>
          <div className="space-y-3">
            {data.links.map(link => (
              <div key={link.id} className="relative p-3 rounded-xl space-y-2"
                   style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <button onClick={() => removeLink(link.id)}
                        className="absolute top-3 left-3 transition-colors"
                        style={{ color: '#555' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                  <Trash2 size={14} />
                </button>
                <input value={link.title} onChange={e => setLink(link.id, 'title', e.target.value)}
                       placeholder="عنوان الرابط" style={{ ...inputStyle, width: 'calc(100% - 28px)' }} />
                <input value={link.url} onChange={e => setLink(link.id, 'url', e.target.value)}
                       placeholder="https://..." style={{ ...inputStyle, direction: 'ltr' }} />
                <select value={link.icon} onChange={e => setLink(link.id, 'icon', e.target.value)}
                        style={inputStyle}>
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all duration-200 active:scale-95"
          style={{
            background: success ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, var(--gold), #b38f21)',
            color: success ? '#22c55e' : '#000',
            border: success ? '1px solid rgba(34,197,94,0.3)' : 'none',
            fontFamily: 'Tajawal',
            opacity: saving ? 0.7 : 1,
          }}>
          <Save size={18} />
          {saving ? 'جاري الحفظ...' : success ? 'تم الحفظ ✓' : 'حفظ التعديلات'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin page ────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken());

  return authed
    ? <Dashboard onLogout={() => setAuthed(false)} />
    : <LoginForm onSuccess={() => setAuthed(true)} />;
}
```

- [ ] **Step 2: Commit**

```bash
cd "f:/Dashboard my father"
git add frontend/src/pages/Admin.jsx
git commit -m "feat: admin login and full dashboard panel"
```

---

### Task 11: Run full dev environment and verify

- [ ] **Step 1: Start backend**

```bash
cd "f:/Dashboard my father/backend" && node server.js
```

Expected: `vCard server running on http://localhost:3000`

- [ ] **Step 2: Start frontend (new terminal)**

```bash
cd "f:/Dashboard my father/frontend" && npm run dev
```

Expected: Vite server on `http://localhost:5173`

- [ ] **Step 3: Verify public card**

Open `http://localhost:5173` — should show luxury vCard with gold design.

- [ ] **Step 4: Verify admin panel**

Open `http://localhost:5173/admin` — should show login form.
Login with: `admin` / `changeme123`
Should redirect to dashboard.

- [ ] **Step 5: Verify save flow**

Change the name in dashboard → click Save → refresh public card → confirm name changed.

- [ ] **Step 6: Run all backend tests**

```bash
cd "f:/Dashboard my father/backend" && npx jest
```

Expected: All tests pass (10 tests total).

- [ ] **Step 7: Commit**

```bash
cd "f:/Dashboard my father"
git add -A
git commit -m "feat: full dev environment verified"
```

---

### Task 12: Production build and VPS deployment prep

**Files:**

- Create: `backend/ecosystem.config.js` (PM2 config)
- Create: `DEPLOY.md`

- [ ] **Step 1: Build frontend for production**

```bash
cd "f:/Dashboard my father/frontend" && npm run build
```

Expected: `frontend/dist/` created with `index.html` and assets.

- [ ] **Step 2: Test production build locally**

```bash
cd "f:/Dashboard my father/backend" && node server.js
```

Open `http://localhost:3000` — should serve the built React app. Open `http://localhost:3000/admin` — should work.

- [ ] **Step 3: Create PM2 config**

Create `backend/ecosystem.config.js`:

```js
module.exports = {
  apps: [{
    name: 'vcard',
    script: 'server.js',
    cwd: '/var/www/vcard/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

- [ ] **Step 4: Create DEPLOY.md**

Create `DEPLOY.md`:

```markdown
# VPS Deployment Guide

## Requirements
- Node.js 18+
- PM2 (`npm install -g pm2`)
- Nginx

## Steps

### 1. Upload files
```bash
scp -r ./backend ./frontend/dist user@your-vps:/var/www/vcard/
```

### 2. Install dependencies

```bash
cd /var/www/vcard/backend && npm install --production
```

### 3. Create .env

```bash
cp .env.example .env
nano .env  # Set JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
```

### 4. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx config

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL (optional but recommended)

```bash
certbot --nginx -d your-domain.com
```

```

- [ ] **Step 5: Final commit**

```bash
cd "f:/Dashboard my father"
git add backend/ecosystem.config.js DEPLOY.md
git commit -m "chore: PM2 config and deployment guide"
```

---

## Self-Review

### Spec coverage

- ✅ Firebase removed — SQLite via better-sqlite3
- ✅ No third-party cloud services
- ✅ `/` public vCard page
- ✅ `/admin` login + dashboard
- ✅ JWT + bcrypt authentication
- ✅ Image upload stored locally
- ✅ Express serves static React build
- ✅ Luxury dark + gold design
- ✅ Download vCard (.vcf)
- ✅ Share / clipboard fallback
- ✅ VPS deployment guide with PM2 + Nginx

### Type/name consistency

- `data.profile_image` / `data.cover_image` — consistent across db.js, vcard.js route, PublicCard.jsx, Admin.jsx ✅
- `data.display_phone` — consistent ✅
- `apiFetch` used in both Login and Dashboard ✅
- `useVCard` hook used only in PublicCard ✅

### No placeholders

- All code blocks are complete ✅
- All commands have expected output ✅
