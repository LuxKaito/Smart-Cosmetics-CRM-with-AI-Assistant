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

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationEmailSchema,
  googleLoginSchema,
  refreshTokenSchema,
  changePasswordSchema
};
