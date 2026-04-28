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
