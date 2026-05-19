const Joi = require('joi');
const { PAYMENT_METHODS } = require('../../shared/constants/order');

const shippingAddressSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^0\d{8,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must start with 0 and contain 9-15 digits.'
    }),
  province: Joi.string().trim().min(1).max(120).required(),
  district: Joi.string().trim().min(1).max(120).required(),
  ward: Joi.string().trim().min(1).max(120).required(),
  addressLine: Joi.string().trim().min(3).max(255).required()
});

const createOrderSchema = Joi.object({
  shippingAddress: shippingAddressSchema.required(),
  paymentMethod: Joi.string()
    .valid(PAYMENT_METHODS.COD, PAYMENT_METHODS.PAYOS)
    .required(),
  note: Joi.string().allow('').max(500).optional(),
  voucherCode: Joi.string().allow('').max(80).optional()
});

const orderIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().allow('').max(200).optional()
});

module.exports = {
  shippingAddressSchema,
  createOrderSchema,
  orderIdParamSchema,
  cancelOrderSchema
};
