const Joi = require('joi');

const addCartItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).default(1)
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

const mergeCartSchema = Joi.object({}).unknown(false);

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  mergeCartSchema
};
