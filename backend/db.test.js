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
