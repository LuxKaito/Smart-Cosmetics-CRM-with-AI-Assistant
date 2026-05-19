const Joi = require('joi');

const payosCreatePaymentSchema = Joi.object({
  orderId: Joi.string().hex().length(24).required()
});

const payosWebhookSchema = Joi.object({
  code: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  desc: Joi.string().allow('').optional(),
  signature: Joi.string().allow('').optional(),
  data: Joi.object().required()
}).unknown(true);

module.exports = {
  payosCreatePaymentSchema,
  payosWebhookSchema
};
