const router = require('express').Router();
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

function serialize(cart) {
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => ({
      productId: i.product._id,
      name: i.product.name,
      icon: i.product.icon,
      price: i.product.price,
      quantity: i.quantity,
      subtotal: i.product.price * i.quantity,
    }));
  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((sum, i) => sum + i.subtotal, 0),
  };
}

function parseQuantity(value) {
  const q = Number(value);
  return Number.isInteger(q) && q >= 1 && q <= 99 ? q : null;
}

router.get('/', async (req, res, next) => {
  try {
    res.json(serialize(await loadCart(req.userId)));
  } catch (err) {
    next(err);
  }
});

router.post('/items', async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = parseQuantity(req.body.quantity ?? 1);
    if (!quantity) return res.status(400).json({ error: 'Quantity must be between 1 and 99' });
    if (!mongoose.isValidObjectId(productId) || !(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const cart = await Cart.findOne({ user: req.userId }) || new Cart({ user: req.userId, items: [] });
    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 99);
    else cart.items.push({ product: productId, quantity });
    await cart.save();

    res.status(201).json(serialize(await loadCart(req.userId)));
  } catch (err) {
    next(err);
  }
});

router.patch('/items/:productId', async (req, res, next) => {
  try {
    const quantity = parseQuantity(req.body.quantity);
    if (!quantity) return res.status(400).json({ error: 'Quantity must be between 1 and 99' });

    const cart = await Cart.findOne({ user: req.userId });
    const item = cart?.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });
    item.quantity = quantity;
    await cart.save();

    res.json(serialize(await loadCart(req.userId)));
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:productId', async (req, res, next) => {
  try {
    await Cart.updateOne({ user: req.userId }, { $pull: { items: { product: req.params.productId } } });
    res.json(serialize(await loadCart(req.userId)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.loadCart = loadCart;
module.exports.serialize = serialize;
