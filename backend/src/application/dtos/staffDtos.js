const Joi = require('joi');
const {
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUSES,
  ORDER_STATUS_VALUES
} = require('../../shared/constants/order');

const mongoId = Joi.string().hex().length(24);

const staffResourceParamSchema = Joi.object({
  id: mongoId.required()
});

const listStaffOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().optional(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHOD_VALUES).optional(),
  paymentStatus: Joi.string().valid(...PAYMENT_STATUS_VALUES).optional(),
  orderStatus: Joi.string().valid(...ORDER_STATUS_VALUES).optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

const listStaffCustomersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isBlocked: Joi.boolean().optional(),
  emailVerified: Joi.boolean().optional(),
  search: Joi.string().trim().optional()
});

const staffOrderStatusSchema = Joi.object({
  orderStatus: Joi.string()
    .valid(ORDER_STATUSES.SHIPPING, ORDER_STATUSES.DELIVERED)
    .required()
});

const staffCancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(240).allow('').optional()
});

module.exports = {
  staffResourceParamSchema,
  listStaffOrdersQuerySchema,
  listStaffCustomersQuerySchema,
  staffOrderStatusSchema,
  staffCancelOrderSchema
};
