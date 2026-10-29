const Product = require('./models/Product');

// Three well-known BrowserStack products. Prices are illustrative, for the demo only.
const products = [
  {
    sku: 'BS-LIVE',
    name: 'Live',
    tagline: 'Interactive cross-browser testing',
    description: 'Test your website manually on 3,500+ real desktop browsers and mobile devices, straight from your browser.',
    price: 39,
    icon: '🖥️',
  },
  {
    sku: 'BS-AUTOMATE',
    name: 'Automate',
    tagline: 'Selenium, Playwright & Cypress at scale',
    description: 'Run your automated web tests in parallel on a cloud grid of real browsers and devices.',
    price: 129,
    icon: '⚙️',
  },
  {
    sku: 'BS-PERCY',
    name: 'Percy',
    tagline: 'Visual testing & review',
    description: 'Catch visual bugs automatically with AI-powered screenshot comparison on every commit.',
    price: 199,
    icon: '👁️',
  },
];

module.exports = async function seedProducts() {
  for (const p of products) {
    await Product.updateOne({ sku: p.sku }, { $set: p }, { upsert: true });
  }
  console.log(`Seeded ${products.length} products`);
};
