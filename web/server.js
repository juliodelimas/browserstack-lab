const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:3001';

const app = express();

app.get('/config.js', (req, res) => {
  res.type('application/javascript').send(`window.API_URL = ${JSON.stringify(API_URL)};`);
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Web app running on http://localhost:${PORT} (API: ${API_URL})`));
