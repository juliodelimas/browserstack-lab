const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tagline: String,
    description: String,
    price: { type: Number, required: true, min: 0 },
    icon: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
