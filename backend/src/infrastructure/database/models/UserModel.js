const mongoose = require('mongoose');
const ROLES = require('../../../shared/constants/roles');
const PERMISSIONS = require('../../../shared/constants/permissions');

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
      default: ROLES.USER,
      index: true
    },
    permissions: [
      {
        type: String,
        enum: PERMISSIONS.ALL
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
