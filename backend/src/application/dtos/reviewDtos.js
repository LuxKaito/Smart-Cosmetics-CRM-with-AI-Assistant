const Joi = require('joi');

const reviewProductParamSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
});

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).allow('').default('')
});

module.exports = {
  reviewProductParamSchema,
  createReviewSchema
};
