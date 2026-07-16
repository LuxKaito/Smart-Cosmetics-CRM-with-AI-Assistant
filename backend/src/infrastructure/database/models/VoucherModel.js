const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

voucherSchema.pre('validate', function normalizeVoucher(next) {
  if (this.code) this.code = String(this.code).trim().toUpperCase();
  if (!this.name && this.code) this.name = this.code;
  if (this.maxDiscount !== null && this.maxDiscount !== undefined && this.discountType === 'fixed') {
    this.maxDiscount = null;
  }
  if (this.endDate && this.startDate && this.endDate.getTime() < this.startDate.getTime()) {
    this.invalidate('endDate', 'endDate must be greater than or equal to startDate');
  }
  next();
});

module.exports = mongoose.model('Voucher', voucherSchema);
