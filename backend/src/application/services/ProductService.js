const AppError = require('../../shared/errors/AppError');

class ProductService {
  constructor({ productRepository, eventPublisher }) {
    this.productRepository = productRepository;
    this.eventPublisher = eventPublisher;
  }

  async list(query) {
    const result = await this.productRepository.search(query);
    return {
      ...result,
      items: result.items.map((item) => toCatalogProduct(item))
    };
  }

  async listCategories() {
    return this.productRepository.listCategories();
  }

  async getById(id) {
    const product = await this.productRepository.findById(id);
    if (!product || product.isActive === false) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return toCatalogProduct(product);
  }

  async create(data) {
    const product = await this.productRepository.create(normalizeProductInput(data));
    await this.eventPublisher.publishProductCreated({
      productId: product._id,
      action: 'created',
      changedAt: new Date()
    });
    return toCatalogProduct(product);
  }

  async update(id, data) {
    const product = await this.productRepository.updateById(id, normalizeProductInput(data));
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    await this.eventPublisher.publishProductUpdated({
      productId: product._id,
      action: 'updated',
      changedAt: new Date()
    });
    return toCatalogProduct(product);
  }

  async delete(id) {
    const product = await this.productRepository.deleteById(id);
    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    await this.eventPublisher.publishProductDeleted({
      productId: product._id,
      action: 'deleted',
      changedAt: new Date()
    });
    return { deleted: true };
  }
}

function normalizeProductInput(data) {
  if (!data || typeof data !== 'object') return data;

  const next = { ...data };

  if (next.product_name_vn && !next.name) next.name = next.product_name_vn;
  if (next.product_name_en && !next.name) next.name = next.product_name_en;
  if (next.name && !next.product_name_vn) next.product_name_vn = next.name;

  const salePrice = toOptionalNumber(next.sale_price);
  const originalPrice = resolveOriginalPrice([next.original_price], salePrice ?? 0);

  if (salePrice !== null) next.sale_price = salePrice;
  if (Object.prototype.hasOwnProperty.call(next, 'original_price')) {
    next.original_price = originalPrice;
  }

  if (next.image_url && !next.images) next.images = [next.image_url];
  if (Array.isArray(next.images)) {
    next.images = [...new Set(next.images.map((image) => String(image || '').trim()).filter(Boolean))];
    if (!next.image_url && next.images.length) next.image_url = next.images[0];
  }

  if (next.category && !next.category_level_2) next.category_level_2 = next.category;
  if (next.subcategory && !next.benefits) next.benefits = next.subcategory;
  if (next.usageInstructions && !next.usage_instructions) {
    next.usage_instructions = next.usageInstructions;
  }

  if (typeof next.categories === 'string') {
    next.categories = [next.categories];
  }

  if (Array.isArray(next.categories)) {
    const categories = next.categories.map((category) => String(category || '').trim()).filter(Boolean);
    if (!next.category_level_1 && categories[0]) next.category_level_1 = categories[0];
    if (!next.category_level_2 && categories[1]) next.category_level_2 = categories[1];
    if (!next.benefits && categories[2]) next.benefits = categories[2];
    if (!next.product_type && categories[3]) next.product_type = categories[3];
  }

  delete next.category;
  delete next.subcategory;
  delete next.categories;
  delete next.usageInstructions;

  return next;
}

function toCatalogProduct(product) {
  const source = product && product.toObject ? product.toObject() : { ...product };
  const categories = [
    source.category_level_1,
    source.category_level_2,
    source.benefits,
    source.product_type
  ].filter(Boolean);
  const images = Array.isArray(source.images) ? source.images.filter(Boolean) : [];
  const description = source.description || '';
  const salePrice = toNonNegativeNumber(source.sale_price, 0);
  const originalPrice = resolveOriginalPrice([source.original_price], salePrice);
  const discountPercent = originalPrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
  const origin = normalizeText(source.origin) || extractLabelFromDescription(description, ['origin', 'xuat xu']);
  const volume = normalizeText(source.volume) || extractLabelFromDescription(description, ['volume', 'dung tich']);

  const normalized = {
    ...source,
    product_name_vn: source.product_name_vn || source.name || '',
    product_name_en: source.product_name_en || '',
    image_url: source.image_url || images[0] || '',
    sale_price: salePrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
    skin_type: source.skin_type || '',
    volume,
    brand: source.brand || '',
    origin,
    rating: Number.isFinite(Number(source.rating)) ? Number(source.rating) : 0,
    review_count: Number.isFinite(Number(source.review_count)) ? Number(source.review_count) : 0,
    qa_count: Number.isFinite(Number(source.qa_count)) ? Number(source.qa_count) : 0,
    description,
    category: source.category_level_2 || source.category_level_1 || '',
    subcategory: source.product_type || source.benefits || '',
    categories,
    images,
    usageInstructions: source.usage_instructions || ''
  };

  normalized.name = normalized.name || normalized.product_name_vn || normalized.product_name_en;

  return normalized;
}

function toNonNegativeNumber(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return numeric;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
}

function resolveOriginalPrice(candidates = [], salePrice = 0) {
  const validCandidates = candidates
    .map((candidate) => toOptionalNumber(candidate))
    .filter((candidate) => candidate !== null && candidate > 0);

  if (!validCandidates.length) return null;
  const original = Math.max(...validCandidates);
  return original > salePrice ? original : null;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeSearchText(value) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractLabelFromDescription(description, labels = []) {
  const normalizedLabels = labels.map((label) => normalizeSearchText(label));
  const lines = String(description || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const rawLabel = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!value) continue;

    if (normalizedLabels.includes(normalizeSearchText(rawLabel))) {
      return value;
    }
  }

  return '';
}

module.exports = ProductService;
