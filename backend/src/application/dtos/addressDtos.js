const Joi = require('joi');

const addressSuggestQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(255).required()
});

const addressDetailQuerySchema = Joi.object({
  placeId: Joi.string().trim().min(5).max(255).required()
});

module.exports = {
  addressSuggestQuerySchema,
  addressDetailQuerySchema
};
