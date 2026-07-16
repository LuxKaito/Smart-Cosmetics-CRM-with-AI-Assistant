const mongoose = require('mongoose');
const ROLES = require('../../../shared/constants/roles');
const PERMISSIONS = require('../../../shared/constants/permissions');
const { DEPARTMENT_VALUES } = require('../../../shared/constants/departments');

const shippingAddressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Địa chỉ giao hàng'
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    province: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    ward: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    passwordHash: {
      type: String,
      select: false
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 32,
      index: true
    },
    shippingAddresses: {
      type: [shippingAddressSchema],
      default: []
    },
    department: {
      type: String,
      enum: ['', ...DEPARTMENT_VALUES],
      default: '',
      index: true
    },
    avatar: {
      type: String,
      trim: true
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    emailVerificationTokenHash: {
      type: String,
      select: false
    },
    emailVerificationExpires: {
      type: Date,
      select: false
    },
    googleId: {
      type: String,
      index: true,
      sparse: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true
    },
    permissions: [
      {
        type: String,
        enum: PERMISSIONS.ALL
      }
    ],
    savedVoucherCodes: [
      {
        type: String,
        trim: true,
        uppercase: true,
        maxlength: 64
      }
    ],
    savedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    },
    refreshTokenHash: {
      type: String,
      select: false
    },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
