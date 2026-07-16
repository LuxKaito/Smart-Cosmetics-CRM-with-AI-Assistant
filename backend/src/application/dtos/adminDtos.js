const Joi = require('joi');
const ROLES = require('../../shared/constants/roles');
const { DEPARTMENT_VALUES } = require('../../shared/constants/departments');

const mongoId = Joi.string().hex().length(24);

const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional(),
  sku: Joi.string().trim().optional(),
  sort: Joi.string()
    .valid('sale_price', '-sale_price', 'rating', '-rating', 'createdAt', '-createdAt', 'soldCount', '-soldCount')
    .default('-createdAt')
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().max(240).required(),
  slug: Joi.string().trim().max(240).optional(),
  sku: Joi.string().trim().max(80).allow('').optional(),
  product_name_vn: Joi.string().trim().max(240).optional(),
  product_name_en: Joi.string().trim().max(240).optional(),
  sale_price: Joi.number().min(0).required(),
  original_price: Joi.number().min(0).allow(null).optional(),
  image_url: Joi.string().trim().allow('').optional(),
  images: Joi.array().items(Joi.string().trim()).default([]),
  description: Joi.string().allow('').default(''),
  shortDescription: Joi.string().allow('').default(''),
  detailDescription: Joi.string().allow('').default(''),
  skin_type: Joi.string().allow('').optional(),
  volume: Joi.string().allow('').optional(),
  brand: Joi.string().allow('').optional(),
  origin: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  subcategory: Joi.string().allow('').optional(),
  categories: Joi.array().items(Joi.string().trim()).optional(),
  category_level_1: Joi.string().allow('').optional(),
  category_level_2: Joi.string().allow('').optional(),
  benefits: Joi.string().allow('').optional(),
  product_type: Joi.string().allow('').optional(),
  ingredients: Joi.string().allow('').optional(),
  usage_instructions: Joi.string().allow('').optional(),
  usageInstructions: Joi.string().allow('').optional(),
  stock: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true)
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().max(240).optional(),
  slug: Joi.string().trim().max(240).optional(),
  sku: Joi.string().trim().max(80).allow('').optional(),
  product_name_vn: Joi.string().trim().max(240).optional(),
  product_name_en: Joi.string().trim().max(240).optional(),
  sale_price: Joi.number().min(0).optional(),
  original_price: Joi.number().min(0).allow(null).optional(),
  image_url: Joi.string().trim().allow('').optional(),
  images: Joi.array().items(Joi.string().trim()).optional(),
  description: Joi.string().allow('').optional(),
  shortDescription: Joi.string().allow('').optional(),
  detailDescription: Joi.string().allow('').optional(),
  skin_type: Joi.string().allow('').optional(),
  volume: Joi.string().allow('').optional(),
  brand: Joi.string().allow('').optional(),
  origin: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  subcategory: Joi.string().allow('').optional(),
  categories: Joi.array().items(Joi.string().trim()).optional(),
  category_level_1: Joi.string().allow('').optional(),
  category_level_2: Joi.string().allow('').optional(),
  benefits: Joi.string().allow('').optional(),
  product_type: Joi.string().allow('').optional(),
  ingredients: Joi.string().allow('').optional(),
  usage_instructions: Joi.string().allow('').optional(),
  usageInstructions: Joi.string().allow('').optional(),
  stock: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid(ROLES.ADMIN, ROLES.STAFF).optional(),
  isBlocked: Joi.boolean().optional(),
  search: Joi.string().trim().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

const overviewQuerySchema = Joi.object({
  preset: Joi.string().valid('7d', '30d', 'month', 'custom').default('7d'),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

const createUserSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().max(32).allow('').optional(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(ROLES.ADMIN, ROLES.STAFF).required(),
  department: Joi.string().valid(...DEPARTMENT_VALUES).allow('').optional(),
  isBlocked: Joi.boolean().default(false)
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().max(120).optional(),
  phone: Joi.string().trim().max(32).allow('').optional(),
  department: Joi.string().valid(...DEPARTMENT_VALUES).allow('').optional(),
  isBlocked: Joi.boolean().optional()
}).min(1);

const assignRoleSchema = Joi.object({
  role: Joi.string().valid(ROLES.ADMIN, ROLES.STAFF).required()
});

const blockUserSchema = Joi.object({
  isBlocked: Joi.boolean().required()
});

const listVouchersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().optional(),
  discountType: Joi.string().valid('percent', 'fixed').optional(),
  isActive: Joi.boolean().optional(),
  sort: Joi.string().valid('code', '-code', 'startDate', '-startDate', 'endDate', '-endDate', 'createdAt', '-createdAt').default('-createdAt')
});

const createVoucherSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(64).required(),
  name: Joi.string().trim().max(160).required(),
  description: Joi.string().allow('').default(''),
  discountType: Joi.string().valid('percent', 'fixed').required(),
  discountValue: Joi.number().min(0).required(),
  minOrderValue: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().min(0).allow(null).optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  usageLimit: Joi.number().integer().min(0).default(0),
  usedCount: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true)
});

const updateVoucherSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(64).optional(),
  name: Joi.string().trim().max(160).optional(),
  description: Joi.string().allow('').optional(),
  discountType: Joi.string().valid('percent', 'fixed').optional(),
  discountValue: Joi.number().min(0).optional(),
  minOrderValue: Joi.number().min(0).optional(),
  maxDiscount: Joi.number().min(0).allow(null).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  usageLimit: Joi.number().integer().min(0).optional(),
  usedCount: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

const statisticsQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional()
});

const adminResourceParamSchema = Joi.object({
  id: mongoId.required()
});

module.exports = {
  overviewQuerySchema,
  listProductsQuerySchema,
  createProductSchema,
  updateProductSchema,
  listUsersQuerySchema,
  createUserSchema,
  updateUserSchema,
  assignRoleSchema,
  blockUserSchema,
  listVouchersQuerySchema,
  createVoucherSchema,
  updateVoucherSchema,
  statisticsQuerySchema,
  adminResourceParamSchema
};
