const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  name: Joi.string().max(120).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().trim().min(32).required()
});

const resendVerificationEmailSchema = Joi.object({
  email: Joi.string().email().required()
});

const googleLoginSchema = Joi.object({
  idToken: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(72).invalid(Joi.ref('currentPassword')).required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  phone: Joi.string().trim().pattern(/^0\d{8,14}$/).allow('')
}).min(1);

const createShippingAddressSchema = Joi.object({
  label: Joi.string().trim().max(80).default('Địa chỉ giao hàng'),
  fullName: Joi.string().trim().min(2).max(120).required(),
  phone: Joi.string().trim().pattern(/^0\d{8,14}$/).required(),
  province: Joi.string().trim().min(2).max(120).required(),
  district: Joi.string().trim().min(2).max(120).required(),
  ward: Joi.string().trim().min(2).max(120).required(),
  addressLine: Joi.string().trim().min(2).max(240).required(),
  isDefault: Joi.boolean().default(false)
});

const updateShippingAddressSchema = Joi.object({
  label: Joi.string().trim().max(80),
  fullName: Joi.string().trim().min(2).max(120),
  phone: Joi.string().trim().pattern(/^0\d{8,14}$/),
  province: Joi.string().trim().min(2).max(120),
  district: Joi.string().trim().min(2).max(120),
  ward: Joi.string().trim().min(2).max(120),
  addressLine: Joi.string().trim().min(2).max(240),
  isDefault: Joi.boolean()
}).min(1);

const shippingAddressParamsSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required()
});

const favoriteProductParamsSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  googleLoginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  createShippingAddressSchema,
  updateShippingAddressSchema,
  shippingAddressParamsSchema,
  favoriteProductParamsSchema
};
