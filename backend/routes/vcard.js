const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { getDb } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Upload config — images only, 5MB max, random filenames
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
    }
    cb(null, true);
  },
});

// GET /api/vcard — public
router.get('/', (req, res) => {
  const db = getDb();
  const vcard = db.prepare(
    'SELECT name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image FROM vcard WHERE id = 1'
  ).get();

  if (!vcard) return res.status(404).json({ error: 'vCard not found' });

  const links = db.prepare(
    'SELECT id, sort, title, type, url, icon FROM links ORDER BY sort ASC'
  ).all();

  res.json({ ...vcard, links });
});

// PUT /api/vcard — protected
router.put('/', auth, (req, res) => {
  const {
    name, title, company, phone, display_phone,
    email, website, address, locations,
    profile_image, cover_image,
  } = req.body;

  // Validate required fields
  const required = { name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image };
  for (const [key, val] of Object.entries(required)) {
    if (val === undefined || val === null || val === '') {
      return res.status(400).json({ error: `Missing required field: ${key}` });
    }
  }

  // Require links to be explicitly provided to prevent accidental deletion
  if (!('links' in req.body)) {
    return res.status(400).json({ error: 'links field is required' });
  }
  const links = req.body.links;

  const db = getDb();

  // Single transaction: update vcard + replace links atomically
  const updateAll = db.transaction(() => {
    db.prepare(`
      UPDATE vcard SET
        name = ?, title = ?, company = ?, phone = ?, display_phone = ?,
        email = ?, website = ?, address = ?, locations = ?,
        profile_image = ?, cover_image = ?
      WHERE id = 1
    `).run(name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image);

    db.prepare('DELETE FROM links').run();
    const insertLink = db.prepare('INSERT INTO links (sort, title, type, url, icon) VALUES (?, ?, ?, ?, ?)');
    links.forEach((link, i) => {
      if (!link.title || !link.url || !link.icon) return; // skip malformed links
      insertLink.run(link.sort ?? i, link.title, link.type || 'link', link.url, link.icon);
    });
  });

  updateAll();
  res.json({ ok: true });
});

// POST /api/vcard/upload — protected
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err.message === 'Only image files are allowed (jpeg, png, gif, webp)') {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
