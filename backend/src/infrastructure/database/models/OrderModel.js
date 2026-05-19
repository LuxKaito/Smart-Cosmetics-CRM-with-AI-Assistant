const mongoose = require('mongoose');
const {
  PAYMENT_METHOD_VALUES,
  PAYMENT_METHODS,
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUSES,
  ORDER_STATUS_VALUES,
  ORDER_STATUSES
} = require('../../../shared/constants/order');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productNameSnapshot: {
      type: String,
      required: true,
      trim: true
    },
    imageSnapshot: {
      type: String,
      trim: true,
      default: ''
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
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    selectedVariant: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Backward-compatible fields
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    price: Number
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    voucherCode: {
      type: String,
      trim: true,
      default: ''
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHOD_VALUES,
      default: PAYMENT_METHODS.COD
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: PAYMENT_STATUSES.UNPAID,
      index: true
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUSES.PENDING_CONFIRMATION,
      index: true
    },
    // Backward-compatible status field for legacy admin dashboards
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipping', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    payosOrderCode: {
      type: Number,
      sparse: true,
      unique: true
    },
    payosCheckoutUrl: {
      type: String,
      trim: true,
      default: ''
    },
    payosPaymentLinkId: {
      type: String,
      trim: true,
      default: ''
    },
    paymentFailureReason: {
      type: String,
      trim: true,
      default: ''
    },
    paidAt: Date,
    cancelledAt: Date
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: 1, status: 1 });
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.pre('validate', function syncLegacyStatus(next) {
  if (this.orderStatus === ORDER_STATUSES.CANCELLED || this.paymentStatus === PAYMENT_STATUSES.CANCELLED) {
    this.status = 'cancelled';
    return next();
  }
  if (this.paymentStatus === PAYMENT_STATUSES.PAID) {
    if (this.orderStatus === ORDER_STATUSES.DELIVERED) this.status = 'completed';
    else if (this.orderStatus === ORDER_STATUSES.SHIPPING) this.status = 'shipping';
    else this.status = 'paid';
    return next();
  }
  this.status = 'pending';
  return next();
});

module.exports = mongoose.model('Order', orderSchema);
