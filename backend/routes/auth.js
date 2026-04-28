const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const router = express.Router();

// Pre-computed dummy hash — always run bcrypt to prevent timing oracle
const DUMMY_HASH = bcrypt.hashSync('dummy', 10);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const admin = getDb().prepare('SELECT * FROM admin WHERE id = 1').get();
  const hash = (admin && admin.username === username) ? admin.password_hash : DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  if (!admin || admin.username !== username || !valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '24h' }
  );

  res.json({ token });
});

module.exports = router;
