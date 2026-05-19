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

const normalizeProductInput = (data) => {
  if (!data || typeof data !== 'object') return data;

  const next = { ...data };

  if (next.product_name_vn && !next.name) next.name = next.product_name_vn;
  if (next.product_name_en && !next.name) next.name = next.product_name_en;
  if (next.name && !next.product_name_vn) next.product_name_vn = next.name;

  const salePrice = toOptionalNumber(next.sale_price ?? next.salePrice ?? next.price);
  const originalPrice = resolveOriginalPrice(
    [next.original_price, next.originalPrice, next.oldPrice, next.regular_price],
    salePrice ?? 0
  );

  if (salePrice !== null) next.sale_price = salePrice;
  if (originalPrice !== null) {
    next.original_price = originalPrice;
  } else {
    delete next.original_price;
  }

  delete next.price;
  delete next.salePrice;
  delete next.originalPrice;
  delete next.oldPrice;
  delete next.regular_price;

  if (next.image_url && !next.images) next.images = [next.image_url];
  if (next.images && Array.isArray(next.images)) {
    next.images = [...new Set(next.images.map((image) => String(image || '').trim()).filter(Boolean))];
    if (!next.image_url && next.images.length) next.image_url = next.images[0];
  }

  if (typeof next.categories === 'string') {
    next.categories = [next.categories];
  }

  if (next.category && !next.categories) {
    next.categories = [next.category];
  }

  if (next.subcategory) {
    next.categories = next.categories || [];
    if (!next.categories.includes(next.subcategory)) next.categories.push(next.subcategory);
  }

  if (next.categories && Array.isArray(next.categories)) {
    next.categories = [...new Set(next.categories.map((category) => String(category || '').trim()).filter(Boolean))];
    if (!next.category && next.categories.length) next.category = next.categories[0];
    if (!next.subcategory && next.categories.length > 1) next.subcategory = next.categories[1];
  }

  return next;
};

const toCatalogProduct = (product) => {
  const sourceRaw = product && product.toObject ? product.toObject() : { ...product };
  const {
    price: legacyPrice,
    salePrice: legacySalePrice,
    originalPrice: legacyOriginalPrice,
    oldPrice: legacyOldPrice,
    regular_price: legacyRegularPrice,
    ...source
  } = sourceRaw;
  const categories = Array.isArray(source.categories) ? source.categories.filter(Boolean) : [];
  const images = Array.isArray(source.images) ? source.images.filter(Boolean) : [];
  const description = source.description || '';
  const salePrice = toNonNegativeNumber(source.sale_price ?? legacySalePrice ?? legacyPrice, 0);
  const fallbackOriginalFromPrice =
    (source.sale_price !== undefined || legacySalePrice !== undefined) && legacyPrice !== undefined
      ? toOptionalNumber(legacyPrice)
      : null;
  const originalPrice = resolveOriginalPrice(
    [source.original_price, legacyOriginalPrice, legacyOldPrice, legacyRegularPrice, fallbackOriginalFromPrice],
    salePrice
  );
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
    category: source.category || categories[0] || '',
    subcategory: source.subcategory || categories[1] || '',
    categories,
    images
  };

  normalized.name = normalized.name || normalized.product_name_vn || normalized.product_name_en;

  return normalized;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  return numeric;
};

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return numeric;
};

const resolveOriginalPrice = (candidates = [], salePrice = 0) => {
  const validCandidates = candidates
    .map((candidate) => toOptionalNumber(candidate))
    .filter((candidate) => candidate !== null && candidate > 0);

  if (!validCandidates.length) return null;
  const original = Math.max(...validCandidates);
  return original > salePrice ? original : null;
};

const normalizeText = (value) => String(value || '').trim();

const normalizeSearchText = (value) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const extractLabelFromDescription = (description, labels = []) => {
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
};

module.exports = ProductService;
