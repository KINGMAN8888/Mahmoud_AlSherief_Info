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
  const replaceLinks = db.transaction(() => {
    db.prepare('DELETE FROM links').run();
    const insertLink = db.prepare('INSERT INTO links (sort, title, type, url, icon) VALUES (?, ?, ?, ?, ?)');
    links.forEach((link, i) => {
      insertLink.run(link.sort ?? i, link.title, link.type, link.url, link.icon);
    });
  });
  replaceLinks();

  res.json({ ok: true });
});

// POST /api/vcard/upload — protected
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
