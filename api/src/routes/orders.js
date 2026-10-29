const router = require('express').Router();
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await Order.find({ user: req.userId }).sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
