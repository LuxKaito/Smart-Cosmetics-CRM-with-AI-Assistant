const Joi = require('joi');

const publicVoucherQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(40).default(12)
});

const voucherCodeParamSchema = Joi.object({
  code: Joi.string().trim().max(64).required()
});

module.exports = {
  publicVoucherQuerySchema,
  voucherCodeParamSchema
};
