const mongoose = require('mongoose');
const { CART_STATUS_VALUES, CART_STATUSES } = require('../../../shared/constants/cart');

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: 0
    },
    productNameSnapshot: {
      type: String,
      trim: true,
      default: ''
    },
    imageSnapshot: {
      type: String,
      trim: true,
      default: ''
    },
    selectedVariant: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    cartTokenHash: {
      type: String,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: CART_STATUS_VALUES,
      default: CART_STATUSES.ACTIVE,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

cartSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: 'objectId' }, status: CART_STATUSES.ACTIVE }
  }
);

cartSchema.index(
  { cartTokenHash: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { cartTokenHash: { $type: 'string' }, status: CART_STATUSES.ACTIVE }
  }
);

cartSchema.pre('validate', function ensureOwner(next) {
  if (!this.userId && !this.cartTokenHash) {
    this.invalidate('userId', 'Cart must belong to a user or a guest session');
  }
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
