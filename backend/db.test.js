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

test('calling getDb() a second time without closing does not duplicate rows', () => {
  const db = getDb();
  // Call getDb() again — should return same singleton
  const db2 = getDb();
  expect(db).toBe(db2); // same reference
  const row = db.prepare('SELECT COUNT(*) as c FROM vcard').get();
  expect(row.c).toBe(1); // still 1 row, not duplicated
});

test('admin password is stored as a bcrypt hash', () => {
  const db = getDb();
  const row = db.prepare('SELECT password_hash FROM admin WHERE id = 1').get();
  expect(row.password_hash).toMatch(/^\$2[aby]\$/);
});
