require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled to allow React app's inline styles

// CORS — supports comma-separated origins for multi-origin setups
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// Static: uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vcard', require('./routes/vcard'));

// JSON 404 for unmatched API routes (must be before SPA fallback)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Static: serve built React app (production)
const distPath = path.join(__dirname, '../frontend/dist');
if (!fs.existsSync(distPath)) {
  console.warn('Warning: frontend/dist not found. Run `npm run build` in the frontend directory.');
}
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).json({ error: 'Frontend not built. Run npm run build.' });
  }
  res.sendFile(indexPath);
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server — abort if DB fails
function start() {
  try {
    getDb(); // synchronous — throws on failure
    app.listen(PORT, () => {
      console.log(`vCard server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
