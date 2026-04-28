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

  const seedAll = db.transaction(() => {
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

    const hasAdmin = db.prepare('SELECT id FROM admin WHERE id = 1').get();
    if (!hasAdmin) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'changeme123';
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('INSERT INTO admin (id, username, password_hash) VALUES (1, ?, ?)').run(username, hash);
    }
  });
  seedAll();
}

module.exports = { getDb, closeDb };
