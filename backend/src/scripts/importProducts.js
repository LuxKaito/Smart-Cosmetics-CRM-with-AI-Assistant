const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const slugify = require('slugify');
const env = require('../config/env');
const Product = require('../infrastructure/database/models/ProductModel');
const logger = require('../shared/utils/logger');

const DEFAULT_FILE = path.join(process.cwd(), 'data', 'Hasaki_Data_Clean.xlsx');

const run = async () => {
  const filePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_FILE;
  await mongoose.connect(env.mongoUri);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  const rows = worksheetToObjects(sheet);

  const result = {
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

      const filter = product.sourceId
        ? { sourceId: product.sourceId }
        : { name: product.name, brand: product.brand };

      const existing = await Product.findOne(filter);
      if (existing) {
        result.duplicates += 1;
        await Product.updateOne(
          { _id: existing._id },
          {
            $set: product,
            $unset: { price: 1 }
          },
          { runValidators: true }
        );
        result.updated += 1;
        continue;
      }

      product.slug = await uniqueSlug(product.name, product.brand);
      await Product.create(product);
      result.created += 1;
    } catch (error) {
      result.errors.push({
        row: index + 2,
        message: error.message
      });
    }
  }

  logger.info('Product import finished', result);
  await mongoose.disconnect();
};

const normalizeRow = (row) => {
  const productNameVn = text(row.product_name_vn);
  const productNameEn = text(row.product_name_en);
  const name = productNameVn || productNameEn;
  const salePrice = number(firstNonEmptyValue(row.sale_price, row.salePrice, row.price));

  if (!name || salePrice === null) return null;

  const categories = [
    text(row.category_level_1),
    text(row.category_level_2),
    text(row.category_level_3),
    text(row.category_level_4)
  ].filter((category) => category && category.toLowerCase() !== 'unknown');

  const imageUrls = text(row.image_url)
    .split(/[,\n;]/)
    .map((url) => url.trim())
    .filter(Boolean);

  const originalPriceCandidate = number(
    firstNonEmptyValue(row.original_price, row.originalPrice, row.old_price, row.oldPrice)
  );
  const originalPrice = resolveOriginalPrice(originalPriceCandidate, salePrice);

  return {
    name,
    product_name_vn: productNameVn || name,
    product_name_en: productNameEn,
    sale_price: salePrice,
    ...(originalPrice !== null ? { original_price: originalPrice } : {}),
    image_url: imageUrls[0] || '',
    images: imageUrls,
    description: buildDescription(row),
    skin_type: text(row.skin_type),
    volume: text(row.volume),
    brand: text(row.brand) || 'Unknown',
    origin: text(row.origin),
    category: categories[0] || '',
    subcategory: categories[1] || '',
    categories,
    rating: clamp(number(row.rating) || 0, 0, 5),
    review_count: toNonNegativeInt(number(row.review_count)),
    qa_count: toNonNegativeInt(number(row.qa_count)),
    stock: 100,
    sourceId: text(row.product_url) || undefined,
    isActive: true
  };
};

const worksheetToObjects = (sheet) => {
  const headers = [];
  const rows = [];

  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim();
  });

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    headers.forEach((header, colNumber) => {
      if (!header) return;
      item[header] = cellText(row.getCell(colNumber).value);
    });
    rows.push(item);
  });

  return rows;
};

const cellText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.text) return value.text;
    if (value.hyperlink) return value.hyperlink;
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    if (value.result !== undefined) return value.result;
  }
  return value;
};

const buildDescription = (row) => {
  const parts = [
    text(row.description),
    text(row.volume) ? `Volume: ${text(row.volume)}` : '',
    text(row.origin) ? `Origin: ${text(row.origin)}` : '',
    text(row.product_url) ? `Source: ${text(row.product_url)}` : ''
  ];

  return parts.filter(Boolean).join('\n\n');
};

const uniqueSlug = async (name, brand) => {
  const base = slugify(`${name}-${brand || ''}`, { lower: true, strict: true }).slice(0, 180) || `product-${Date.now()}`;
  let slug = base;
  let counter = 1;

  while (await Product.exists({ slug })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
};

const text = (value) => String(value ?? '').trim();

const number = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveOriginalPrice = (originalPrice, salePrice) => {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) return null;
  return originalPrice > salePrice ? originalPrice : null;
};

const firstNonEmptyValue = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const toNonNegativeInt = (value) => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

run().catch(async (error) => {
  logger.error('Product import failed', { error: error.message, stack: error.stack });
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
