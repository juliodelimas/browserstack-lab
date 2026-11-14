require('dotenv').config();
const express = require('express');
const cors = require('cors');

const seedProducts = require('./seed');
const db = require('./db');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

db.connect()
  .then(async (description) => {
    console.log(`Database: ${description}`);
    await seedProducts();
    const server = app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    const shutdown = () => server.close(() => db.disconnect().finally(() => process.exit(0)));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((err) => {
    console.error('Failed to start API:', err.message);
    process.exit(1);
  });
