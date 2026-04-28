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
