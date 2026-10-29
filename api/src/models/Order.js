const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: { type: Number, required: true },
    billing: {
      fullName: String,
      company: String,
      address: String,
      city: String,
      zip: String,
      country: String,
    },
    paymentMethod: { type: String, default: 'invoice' },
    status: { type: String, default: 'confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
