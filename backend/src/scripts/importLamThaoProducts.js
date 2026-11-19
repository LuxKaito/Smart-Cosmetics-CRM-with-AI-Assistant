const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const slugify = require('slugify');

const env = require('../config/env');
const Product = require('../infrastructure/database/models/ProductModel');

const REQUIRED_SHEETS = ['products', 'variants', 'category_map'];
const PRODUCT_COLUMNS = ['product_id', 'product_name_vn', 'brand', 'sale_price'];
const VARIANT_COLUMNS = ['product_id', 'variant_id', 'variant_title'];

async function run() {
  const args = process.argv.slice(2);
  const inputPath = args.find((argument) => argument !== '--dry-run');
  const filePath = inputPath
    ? path.resolve(inputPath)
    : path.resolve(process.cwd(), 'data', 'LamThao_Data.xlsx');
  const dryRun = args.includes('--dry-run');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  for (const sheetName of REQUIRED_SHEETS) {
    if (!workbook.getWorksheet(sheetName)) {
      throw new Error(`Missing required worksheet: ${sheetName}`);
    }
  }

  const products = worksheetToObjects(workbook.getWorksheet('products'));
  const variants = worksheetToObjects(workbook.getWorksheet('variants'));
  const categoryMap = worksheetToObjects(workbook.getWorksheet('category_map'));
  validateWorkbook(products, variants, categoryMap);

  const variantsByProduct = groupBy(variants, (variant) => normalizeText(variant.product_id));
  const normalizedProducts = products.map((row) => normalizeProduct(row, variantsByProduct));
  const report = buildReport(normalizedProducts, variants, categoryMap);

  if (dryRun) {
    console.log(JSON.stringify({ mode: 'dry-run', filePath, ...report }, null, 2));
    return;
  }

  await mongoose.connect(env.mongoUri);

  try {
    const operations = normalizedProducts.map((product) => ({
      updateOne: {
        filter: { source: 'lamthao', sourceId: product.sourceId },
        update: { $set: product },
        upsert: true
      }
    }));

    const writeResult = await Product.bulkWrite(operations, {
      ordered: true,
      skipValidation: false
    });

    const sourceIds = normalizedProducts.map((product) => product.sourceId);
    const importedCount = await Product.countDocuments({
      source: 'lamthao',
      sourceId: { $in: sourceIds }
    });
    if (importedCount !== normalizedProducts.length) {
      throw new Error(
        `Import count mismatch: expected ${normalizedProducts.length} workbook products, found ${importedCount}`
      );
    }

    const importedWithVariants = await Product.countDocuments({
      source: 'lamthao',
      sourceId: { $in: sourceIds },
      'variants.0': { $exists: true }
    });
    if (importedWithVariants !== normalizedProducts.length) {
      throw new Error(
        `Variant integrity check failed: ${importedWithVariants}/${normalizedProducts.length} imported products have variants`
      );
    }

    const removedOtherProducts = await Product.deleteMany({ source: { $ne: 'lamthao' } });
    const removedStaleProducts = await Product.deleteMany({
      source: 'lamthao',
      sourceId: { $nin: sourceIds }
    });
    const finalProductCount = await Product.countDocuments({});
    if (finalProductCount !== normalizedProducts.length) {
      throw new Error(
        `Replacement count mismatch: expected ${normalizedProducts.length} products, found ${finalProductCount}`
      );
    }

    console.log(
      JSON.stringify(
        {
          mode: 'imported',
          filePath,
          products: normalizedProducts.length,
          variants: variants.length,
          categories: report.categoryLevels,
          productsWithVariants: importedWithVariants,
          upserted: writeResult.upsertedCount,
          modified: writeResult.modifiedCount,
          deletedOldProducts: removedOtherProducts.deletedCount + removedStaleProducts.deletedCount,
          finalProducts: finalProductCount,
          missingImages: report.missingImages,
          productsWithoutMappedCategory: report.productsWithoutMappedCategory
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

function validateWorkbook(products, variants, categoryMap) {
  validateColumns(products, PRODUCT_COLUMNS, 'products');
  validateColumns(variants, VARIANT_COLUMNS, 'variants');
  validateColumns(categoryMap, ['product_type', 'category_map_status'], 'category_map');

  const productIds = products.map((row) => normalizeText(row.product_id));
  const variantIds = variants.map((row) => normalizeText(row.variant_id));
  assertUnique(productIds, 'product_id');
  assertUnique(variantIds, 'variant_id');

  const productIdSet = new Set(productIds);
  const variantsByProduct = groupBy(variants, (variant) => normalizeText(variant.product_id));
  const orphanVariants = variants.filter((variant) => !productIdSet.has(normalizeText(variant.product_id)));
  if (orphanVariants.length) {
    throw new Error(`Workbook contains ${orphanVariants.length} variants without a matching product`);
  }

  const countMismatches = products.filter((product) => {
    const actual = (variantsByProduct.get(normalizeText(product.product_id)) || []).length;
    const declared = toNumber(product.variant_count);
    return declared !== null && declared !== actual;
  });
  if (countMismatches.length) {
    throw new Error(`Workbook has variant_count mismatches for ${countMismatches.length} products`);
  }

  const invalidProducts = products.filter((row) =>
    !normalizeText(row.product_id) ||
    !normalizeText(row.product_name_vn || row.product_name_en) ||
    toNumber(row.sale_price) === null
  );
  if (invalidProducts.length) {
    throw new Error(`Workbook contains ${invalidProducts.length} products missing an ID, name, or valid price`);
  }

  const categoryTypes = new Set(categoryMap.map((row) => normalizeText(row.product_type)));
  const missingCategoryMapRows = products.filter(
    (row) => normalizeText(row.category_map_status) === 'auto' && !categoryTypes.has(normalizeText(row.product_type))
  );
  if (missingCategoryMapRows.length) {
    throw new Error(`Workbook is missing ${missingCategoryMapRows.length} automatic category mappings`);
  }
}

function normalizeProduct(row, variantsByProduct) {
  const id = normalizeText(row.product_id);
  const name = normalizeText(row.product_name_vn || row.product_name_en);
  const brand = normalizeText(row.brand) || 'Khác';
  const salePrice = toNumber(row.sale_price);
  const categoryLevels = [1, 2, 3, 4].map((level) => normalizeText(row[`category_level_${level}`]));
  const images = normalizeImages(row.image_url, row.image_urls);
  const childVariants = (variantsByProduct.get(id) || []).map(normalizeVariant);
  const sourceData = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, cellToValue(value)])
  );

  return {
    name,
    product_name_vn: normalizeText(row.product_name_vn) || name,
    product_name_en: normalizeText(row.product_name_en),
    slug: `${slugify(`${name}-${brand}`, { lower: true, strict: true }).slice(0, 180) || 'product'}-${id}`,
    sku: normalizeList(row.skus)[0] || '',
    sale_price: salePrice,
    original_price: toNumber(row.original_price),
    price_min: toNumber(row.price_min),
    price_max: toNumber(row.price_max),
    image_url: images[0] || '',
    images,
    image_count: toNonNegativeInt(toNumber(row.image_count)),
    description: normalizeText(row.description),
    short_description: normalizeText(row.short_description),
    shortDescription: normalizeText(row.short_description),
    skin_type: normalizeText(row.skin_type),
    volume: normalizeText(row.volume),
    brand,
    origin: normalizeText(row.origin),
    made_in: normalizeText(row.made_in),
    category_level_1: categoryLevels[0],
    category_level_2: categoryLevels[1],
    category_level_3: categoryLevels[2],
    category_level_4: categoryLevels[3],
    category_path: categoryLevels.filter(Boolean),
    benefits: normalizeText(row.benefits),
    product_type: categoryLevels[3] || normalizeText(row.product_type),
    source_product_type: normalizeText(row.product_type),
    ingredients: normalizeText(row.full_ingredients || row.main_ingredients),
    main_ingredients: normalizeText(row.main_ingredients),
    full_ingredients: normalizeText(row.full_ingredients),
    usage_instructions: normalizeText(row.usage_instructions),
    warnings: normalizeText(row.warnings),
    storage: normalizeText(row.storage),
    scent_notes: normalizeText(row.scent_notes),
    specs: normalizeText(row.specs),
    brand_story: normalizeText(row.brand_story),
    seo_title: normalizeText(row.seo_title),
    promo_note: normalizeText(row.promo_note),
    source_tags: normalizeText(row.tags),
    source_product_url: normalizeText(row.product_url),
    category_map_status: normalizeText(row.category_map_status),
    rating: clamp(toNumber(row.rating) || 0, 0, 5),
    review_count: toNonNegativeInt(toNumber(row.review_count)),
    qa_count: toNonNegativeInt(toNumber(row.qa_count)),
    stock: toNonNegativeInt(toNumber(row.total_inventory) ?? 0),
    source_total_inventory: toNumber(row.total_inventory),
    soldCount: toNonNegativeInt(toNumber(row.sold_count)),
    available: toBoolean(row.available, false),
    variant_count: childVariants.length,
    variants: childVariants,
    source: 'lamthao',
    sourceId: id,
    source_data: sourceData,
    isActive: true
  };
}

function normalizeVariant(row) {
  return {
    product_id: normalizeText(row.product_id),
    variant_id: normalizeText(row.variant_id),
    variant_title: normalizeText(row.variant_title),
    option1: normalizeText(row.option1),
    option2: normalizeText(row.option2),
    option3: normalizeText(row.option3),
    sale_price: toNumber(row.sale_price),
    original_price: toNumber(row.original_price),
    available: toBoolean(row.available, false),
    inventory_quantity: toNumber(row.inventory_quantity),
    barcode: normalizeText(row.barcode),
    sku: normalizeText(row.sku),
    image_url: normalizeText(row.image_url),
    product_url: normalizeText(row.product_url)
  };
}

function normalizeImages(primaryImage, imageUrls) {
  const values = [
    ...splitImageValues(primaryImage, /[;\n]+/),
    ...splitImageValues(imageUrls, /[|;\n]+/)
  ];
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function splitImageValues(value, separator) {
  return String(value ?? '').split(separator).map((image) => image.trim()).filter(Boolean);
}

function worksheetToObjects(sheet) {
  const headers = [];
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = normalizeText(cell.value);
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    headers.forEach((header, columnNumber) => {
      if (header) item[header] = cellToValue(row.getCell(columnNumber).value);
    });
    if (Object.values(item).some((value) => value !== null && value !== undefined && value !== '')) {
      rows.push(item);
    }
  });
  return rows;
}

function cellToValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date || typeof value !== 'object') return value;
  if (value.result !== undefined) return value.result;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
  if (value.text !== undefined) return value.text;
  if (value.hyperlink !== undefined) return value.hyperlink;
  return String(value);
}

function validateColumns(rows, requiredColumns, sheetName) {
  const available = new Set(Object.keys(rows[0] || {}));
  const missing = requiredColumns.filter((column) => !available.has(column));
  if (missing.length) {
    throw new Error(`Worksheet ${sheetName} is missing columns: ${missing.join(', ')}`);
  }
}

function assertUnique(values, name) {
  const duplicates = values.filter((value, index) => !value || values.indexOf(value) !== index);
  if (duplicates.length) throw new Error(`Workbook has ${duplicates.length} blank or duplicate ${name} values`);
}

function groupBy(values, keySelector) {
  return values.reduce((groups, value) => {
    const key = keySelector(value);
    const group = groups.get(key) || [];
    group.push(value);
    groups.set(key, group);
    return groups;
  }, new Map());
}

function buildReport(products, variants, categoryMap) {
  const categoryLevels = [1, 2, 3, 4].map((level) => ({
    level,
    distinct: new Set(products.map((product) => product[`category_level_${level}`]).filter(Boolean)).size
  }));

  return {
    products: products.length,
    variants: variants.length,
    categoryMapRows: categoryMap.length,
    productsWithVariants: products.filter((product) => product.variants.length > 0).length,
    categoryLevels,
    missingImages: products.filter((product) => product.images.length === 0).length,
    productsWithoutMappedCategory: products.filter((product) => product.category_path.length < 4).length,
    unavailableProducts: products.filter((product) => !product.available).length
  };
}

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeList(value) {
  return String(value ?? '').split(/[|;\n]+/).map((item) => item.trim()).filter(Boolean);
}

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  const normalized = normalizeText(value).toLowerCase();
  if (['true', '1', 'yes', 'có'].includes(normalized)) return true;
  if (['false', '0', 'no', 'không'].includes(normalized)) return false;
  return fallback;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number(String(value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNonNegativeInt(value) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

run().catch(async (error) => {
  console.error('LamThao product import failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
