const Joi = require('joi');

const productQuerySchema = Joi.object({
  q: Joi.string().trim().optional(),
  search: Joi.string().trim().optional(),
  skin_type: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  subcategory: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid('price', '-price', 'sale_price', '-sale_price', 'rating', '-rating', 'createdAt', '-createdAt', 'soldCount', '-soldCount')
    .default('-createdAt')
});

const productCreateSchema = Joi.object({
  name: Joi.string().trim().max(240).optional(),
  product_name_vn: Joi.string().trim().max(240).optional(),
  product_name_en: Joi.string().trim().max(240).optional(),
  price: Joi.number().min(0).optional(),
  sale_price: Joi.number().min(0).optional(),
  original_price: Joi.number().min(0).optional(),
  image_url: Joi.string().trim().optional(),
  images: Joi.array().items(Joi.string().trim()).default([]),
  description: Joi.string().allow('').optional(),
  skin_type: Joi.string().allow('').optional(),
  volume: Joi.string().allow('').optional(),
  brand: Joi.string().allow('').optional(),
  origin: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  subcategory: Joi.string().allow('').optional(),
  categories: Joi.array().items(Joi.string().trim()).optional(),
  rating: Joi.number().min(0).max(5).default(0),
  review_count: Joi.number().integer().min(0).default(0),
  qa_count: Joi.number().integer().min(0).default(0),
  stock: Joi.number().integer().min(0).default(0)
})
  .or('name', 'product_name_vn', 'product_name_en')
  .or('price', 'sale_price');

const productUpdateSchema = Joi.object({
  name: Joi.string().trim().max(240).optional(),
  product_name_vn: Joi.string().trim().max(240).optional(),
  product_name_en: Joi.string().trim().max(240).optional(),
  price: Joi.number().min(0).optional(),
  sale_price: Joi.number().min(0).optional(),
  original_price: Joi.number().min(0).optional(),
  image_url: Joi.string().trim().optional(),
  images: Joi.array().items(Joi.string().trim()).optional(),
  description: Joi.string().allow('').optional(),
  skin_type: Joi.string().allow('').optional(),
  volume: Joi.string().allow('').optional(),
  brand: Joi.string().allow('').optional(),
  origin: Joi.string().allow('').optional(),
  category: Joi.string().allow('').optional(),
  subcategory: Joi.string().allow('').optional(),
  categories: Joi.array().items(Joi.string().trim()).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  review_count: Joi.number().integer().min(0).optional(),
  qa_count: Joi.number().integer().min(0).optional(),
  stock: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

module.exports = {
  productQuerySchema,
  productCreateSchema,
  productUpdateSchema
};
