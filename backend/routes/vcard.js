const express  = require('express');
const formidable = require('formidable');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const { getDb } = require('../db');
const auth     = require('../middleware/auth');

const router = express.Router();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const UPLOAD_DIR   = path.join(__dirname, '../uploads');

/* ── GET /api/vcard/public ─────────────────────────────── */
router.get('/public', (req, res) => {
  const db    = getDb();
  const vcard = db.prepare(
    'SELECT name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image FROM vcard WHERE id = 1'
  ).get();

  if (!vcard) return res.status(404).json({ error: 'vCard not found' });

  const links = db.prepare(
    'SELECT id, sort, title, type, url, icon FROM links ORDER BY sort ASC'
  ).all();

  res.json({ ...vcard, links });
});

/* ── GET /api/vcard — protected (admin) ───────────────── */
router.get('/', auth, (req, res) => {
  const db    = getDb();
  const vcard = db.prepare(
    'SELECT name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image FROM vcard WHERE id = 1'
  ).get();

  if (!vcard) return res.status(404).json({ error: 'vCard not found' });

  const links = db.prepare(
    'SELECT id, sort, title, type, url, icon FROM links ORDER BY sort ASC'
  ).all();

  res.json({ ...vcard, links });
});

/* ── PUT /api/vcard — protected ───────────────────────── */
router.put('/', auth, (req, res) => {
  const {
    name, title, company, phone, display_phone,
    email, website, address, locations,
    profile_image, cover_image,
  } = req.body;

  const required = { name, title, company, phone, display_phone, email, website, address, locations, profile_image, cover_image };
  for (const [key, val] of Object.entries(required)) {
    if (val === undefined || val === null || val === '') {
      return res.status(400).json({ error: `Missing required field: ${key}` });
    }
  }

  if (!('links' in req.body)) {
    return res.status(400).json({ error: 'links field is required' });
  }
  const links = req.body.links;

  const db = getDb();

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
      if (!link.title || !link.url || !link.icon) return;
      insertLink.run(link.sort ?? i, link.title, link.type || 'link', link.url, link.icon);
    });
  });

  updateAll();
  res.json({ ok: true });
});

/* ── POST /api/vcard/upload — protected ──────────────── */
router.post('/upload', auth, (req, res) => {
  const form = formidable({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    filename: (_name, ext) =>
      `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`,
  });

  form.parse(req, (err, _fields, files) => {
    if (err) return res.status(400).json({ error: 'Upload failed: ' + err.message });

    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploaded) return res.status(400).json({ error: 'No file uploaded' });

    if (!ALLOWED_MIME.has(uploaded.mimetype)) {
      try { fs.unlinkSync(uploaded.filepath); } catch {}
      return res.status(400).json({ error: 'Only image files allowed (jpeg, png, gif, webp)' });
    }

    res.json({ url: `/uploads/${path.basename(uploaded.filepath)}` });
  });
});

module.exports = router;
