// One-time script to fix link titles with proper Arabic text
const { getDb } = require('./db');

const db = getDb();

const updateAll = db.transaction(() => {
  db.prepare('DELETE FROM links').run();
  const insert = db.prepare('INSERT INTO links (sort, title, type, url, icon) VALUES (?, ?, ?, ?, ?)');
  const links = [
    [1, 'اتصال هاتفي',        'phone',    'tel:+966536413795',                      'Phone'],
    [2, 'محادثة واتساب',       'whatsapp', 'https://wa.me/966536413795',             'MessageCircle'],
    [3, 'البريد الإلكتروني',   'email',    'mailto:ceo@altawasul-alalami.com',        'Mail'],
    [4, 'الموقع الإلكتروني',   'website',  'https://www.altawasul-alalami.com',       'Globe'],
    [5, 'موقع المكتب',         'map',      'https://maps.google.com/?q=Makkah,Saudi+Arabia', 'MapPin'],
  ];
  links.forEach(l => insert.run(...l));

  // Also update vcard with better cover image and more locations
  db.prepare(`
    UPDATE vcard SET
      cover_image = ?,
      profile_image = ?,
      address = ?,
      locations = ?
    WHERE id = 1
  `).run(
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop',
    'https://placehold.co/400x400/1a1a1a/d4af37?text=MA',
    'Third Ring Road Branch, 2974, Makkah Al-Mukarramah, Saudi Arabia',
    'Mecca - Medina - Indonesia - Malaysia - Egypt'
  );
});

updateAll();

const result = db.prepare('SELECT * FROM links ORDER BY sort').all();
console.log('Links updated:');
result.forEach(l => console.log(` [${l.sort}] ${l.title} → ${l.url}`));

const vcard = db.prepare('SELECT cover_image, profile_image, address, locations FROM vcard WHERE id = 1').get();
console.log('\nvCard updated:', vcard);

process.exit(0);
