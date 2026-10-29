const router = require('express').Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');
const { loadCart, serialize } = require('./cart');

const REQUIRED = ['fullName', 'address', 'city', 'zip', 'country'];
const PAYMENT_METHODS = ['credit-card', 'invoice', 'paypal'];

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const billing = {};
    for (const field of ['fullName', 'company', 'address', 'city', 'zip', 'country']) {
      billing[field] = (req.body[field] || '').trim();
    }
    const missing = REQUIRED.filter((f) => !billing[f]);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const paymentMethod = req.body.paymentMethod || 'credit-card';
    if (!PAYMENT_METHODS.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });

    const cart = serialize(await loadCart(req.userId));
    if (!cart.items.length) return res.status(400).json({ error: 'Your cart is empty' });

    const order = await Order.create({
      user: req.userId,
      items: cart.items.map((i) => ({ product: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
      total: cart.total,
      billing,
      paymentMethod,
    });
    await Cart.updateOne({ user: req.userId }, { $set: { items: [] } });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
