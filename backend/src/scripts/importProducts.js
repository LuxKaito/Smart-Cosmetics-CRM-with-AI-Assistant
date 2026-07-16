const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const slugify = require('slugify');

const env = require('../config/env');
const Product = require('../infrastructure/database/models/ProductModel');
const logger = require('../shared/utils/logger');

const DEFAULT_DATA_FILE = path.join(process.cwd(), 'data', 'Hasaki_Data_Final.xlsx');
const REQUIRED_COLUMNS = [
  'product_name_vn',
  'product_name_en',
  'description',
  'volume',
  'brand',
  'origin',
  'skin_type',
  'original_price',
  'sale_price',
  'rating',
  'review_count',
  'qa_count',
  'image_url',
  'category_level_1',
  'category_level_2',
  'category_level_3',
  'category_level_4',
  'ingredients',
  'usage_instructions'
];

async function run() {
  const filePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DATA_FILE;

  await mongoose.connect(env.mongoUri);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  const rows = worksheetToObjects(worksheet);
  validateColumns(rows);

  const result = {
    filePath,
    totalRows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    duplicates: 0,
    errors: []
  };

  for (const [index, row] of rows.entries()) {
    try {
      const product = normalizeRow(row);
      if (!product) {
        result.skipped += 1;
        continue;
      }

      const existing = await Product.findOne({
        name: new RegExp(`^${escapeRegExp(product.name)}$`, 'i'),
        brand: new RegExp(`^${escapeRegExp(product.brand || '')}$`, 'i')
      });

      if (existing) {
        result.duplicates += 1;
        await Product.updateOne(
          { _id: existing._id },
          {
            $set: product
          },
          { runValidators: true }
        );
        await removeLegacyCategoryFields(existing._id);
        result.updated += 1;
        continue;
      }

      product.slug = await uniqueSlug(product.name, product.brand);
      await Product.create(product);
      result.created += 1;
    } catch (error) {
      result.errors.push({ row: index + 2, message: error.message });
    }
  }

  await migrateLegacyCategoryFields();
  logger.info('Product import finished', result);
  await mongoose.disconnect();
}

function validateColumns(rows) {
  const firstRow = rows[0] || {};
  const available = new Set(Object.keys(firstRow));
  const missing = REQUIRED_COLUMNS.filter((column) => !available.has(column));

  if (missing.length > 0) {
    throw new Error(`Missing required columns in Excel file: ${missing.join(', ')}`);
  }
}

function normalizeRow(row) {
  const productNameVn = normalizeText(row.product_name_vn);
  const productNameEn = normalizeText(row.product_name_en);
  const name = productNameVn || productNameEn;

  const salePrice = toNumber(row.sale_price);
  if (!name || salePrice === null) return null;

  const originalPrice = resolveOriginalPrice(toNumber(row.original_price), salePrice);
  const imageList = normalizeText(row.image_url)
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name,
    product_name_vn: productNameVn || name,
    product_name_en: productNameEn,
    sale_price: salePrice,
    original_price: originalPrice,
    image_url: imageList[0] || '',
    images: imageList,
    description: normalizeText(row.description),
    skin_type: normalizeText(row.skin_type),
    volume: normalizeText(row.volume),
    brand: normalizeText(row.brand) || 'Unknown',
    origin: normalizeText(row.origin),
    category_level_1: normalizeText(row.category_level_1),
    category_level_2: normalizeText(row.category_level_2),
    benefits: normalizeText(row.category_level_3),
    product_type: normalizeText(row.category_level_4),
    ingredients: normalizeText(row.ingredients),
    usage_instructions: normalizeText(row.usage_instructions),
    rating: clamp(toNumber(row.rating) || 0, 0, 5),
    review_count: toNonNegativeInt(toNumber(row.review_count)),
    qa_count: toNonNegativeInt(toNumber(row.qa_count)),
    stock: 100,
    isActive: true
  };
}

async function removeLegacyCategoryFields(productId) {
  await Product.collection.updateOne(
    { _id: productId },
    {
      $unset: {
        category: '',
        subcategory: '',
        categories: '',
        category_level_3: '',
        category_level_4: '',
        usageInstructions: ''
      }
    }
  );
}

async function migrateLegacyCategoryFields() {
  const categories = { $ifNull: ['$categories', []] };
  await Product.collection.updateMany(
    {},
    [
      {
        $set: {
          category_level_1: {
            $ifNull: ['$category_level_1', { $ifNull: ['$category', { $arrayElemAt: [categories, 0] }] }]
          },
          category_level_2: {
            $ifNull: ['$category_level_2', { $ifNull: [{ $arrayElemAt: [categories, 1] }, '$subcategory'] }]
          },
          benefits: {
            $ifNull: ['$benefits', { $arrayElemAt: [categories, 2] }]
          },
          product_type: {
            $ifNull: ['$product_type', { $arrayElemAt: [categories, 3] }]
          },
          usage_instructions: {
            $ifNull: ['$usage_instructions', '$usageInstructions']
          }
        }
      },
      {
        $unset: [
          'category',
          'subcategory',
          'categories',
          'category_level_3',
          'category_level_4',
          'usageInstructions'
        ]
      }
    ]
  );
}

function worksheetToObjects(sheet) {
  const headers = [];
  const rows = [];

  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = String(cell.value || '').trim();
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const item = {};
    headers.forEach((header, columnNumber) => {
      if (!header) return;
      item[header] = cellToText(row.getCell(columnNumber).value);
    });
    rows.push(item);
  });

  return rows;
}

function cellToText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.text) return value.text;
    if (value.hyperlink) return value.hyperlink;
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if (value.result !== undefined) return value.result;
  }
  return value;
}

async function uniqueSlug(name, brand) {
  const base =
    slugify(`${name}-${brand || ''}`, { lower: true, strict: true }).slice(0, 180) ||
    `product-${Date.now()}`;

  let slug = base;
  let suffix = 1;

  while (await Product.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveOriginalPrice(originalPrice, salePrice) {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) return null;
  return originalPrice > salePrice ? originalPrice : null;
}

function toNonNegativeInt(value) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run().catch(async (error) => {
  logger.error('Product import failed', { error: error.message, stack: error.stack });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
