const router = require('express').Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

router.get('/', async (req, res, next) => {
  try {
    res.json(await Product.find().sort({ price: 1 }));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
