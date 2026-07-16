const Product = require('../models/ProductModel');
const {
  buildProductSearchQuery,
  escapeRegex
} = require('../../../shared/utils/productSearch');

class MongoProductRepository {
  async create(data) {
    return Product.create(data);
  }

  async findById(id) {
    return Product.findById(id);
  }

  async findByNameAndBrand(name, brand) {
    return Product.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, 'i'),
      brand: new RegExp(`^${escapeRegExp(brand || '')}$`, 'i')
    });
  }

  async updateById(id, data) {
    return Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async updateReviewSummary(id, { rating, reviewCount }) {
    return Product.findByIdAndUpdate(
      id,
      {
        rating,
        review_count: reviewCount
      },
      {
        new: true,
        runValidators: true
      }
    );
  }

  async findByIds(ids = []) {
    return Product.find({ _id: { $in: ids } });
  }

  async deleteById(id) {
    return Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  async decreaseStock(productId, quantity) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        stock: { $gte: quantity },
        isActive: true
      },
      {
        $inc: {
          stock: -quantity,
          soldCount: quantity
        }
      },
      { new: true }
    );
  }

  async search(query) {
    const {
      search,
      q,
      sku,
      category,
      subcategory,
      category_level_1,
      category_level_2,
      benefits,
      product_type,
      brand,
      skin_type,
      minPrice,
      maxPrice,
      isActive,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      includeInactive = false
    } = query;

    const keyword = String(search || q || '').trim();
    const normalizedPage = toPositiveInteger(page, 1);
    const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);

    const filter = {};
    if (!includeInactive) {
      filter.isActive = true;
    } else {
      const normalizedIsActive = toOptionalBoolean(isActive);
      if (typeof normalizedIsActive === 'boolean') {
        filter.isActive = normalizedIsActive;
      }
    }

    if (category) {
      const categoryRegex = new RegExp(`^${escapeRegExp(category)}$`, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { category_level_1: categoryRegex },
          { category_level_2: categoryRegex },
          { benefits: categoryRegex },
          { product_type: categoryRegex }
        ]
      });
    }

    if (subcategory) {
      const subcategoryRegex = new RegExp(`^${escapeRegExp(subcategory)}$`, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ benefits: subcategoryRegex }, { product_type: subcategoryRegex }]
      });
    }

    if (category_level_1) filter.category_level_1 = new RegExp(`^${escapeRegExp(category_level_1)}$`, 'i');
    if (category_level_2) filter.category_level_2 = new RegExp(`^${escapeRegExp(category_level_2)}$`, 'i');
    if (benefits) filter.benefits = new RegExp(`^${escapeRegExp(benefits)}$`, 'i');
    if (product_type) filter.product_type = new RegExp(`^${escapeRegExp(product_type)}$`, 'i');

    if (brand) filter.brand = new RegExp(`^${escapeRegExp(brand)}$`, 'i');
    if (skin_type) filter.skin_type = new RegExp(`^${escapeRegExp(skin_type)}$`, 'i');
    if (sku) filter.sku = new RegExp(`^${escapeRegExp(sku)}$`, 'i');

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.sale_price = {};
      if (minPrice !== undefined) filter.sale_price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.sale_price.$lte = Number(maxPrice);
    }

    const searchQuery = buildProductSearchQuery(keyword);
    const resolvedFilter = await resolveProductSearchFilter(filter, searchQuery);

    const skip = (normalizedPage - 1) * normalizedLimit;
    const sortObject = normalizeSort(sort);

    const [items, total] = await Promise.all([
      Product.find(resolvedFilter).sort(sortObject).skip(skip).limit(normalizedLimit),
      Product.countDocuments(resolvedFilter)
    ]);

    return {
      items,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        pages: Math.ceil(total / normalizedLimit) || 1
      }
    };
  }

  async listCategories() {
    const docs = await Product.find(
      { isActive: true },
      { category_level_1: 1, category_level_2: 1, benefits: 1, product_type: 1, _id: 0 }
    ).lean();

    const categories = new Set();
    const subcategories = new Set();
    const subcategoriesByCategory = {};

    for (const doc of docs) {
      const mainCategory = normalizeText(doc.category_level_2) || normalizeText(doc.category_level_1);
      const childCategory = normalizeText(doc.product_type) || normalizeText(doc.benefits);

      if (mainCategory) {
        categories.add(mainCategory);
        if (!subcategoriesByCategory[mainCategory]) subcategoriesByCategory[mainCategory] = new Set();
      }

      if (childCategory) {
        subcategories.add(childCategory);
        if (mainCategory) subcategoriesByCategory[mainCategory].add(childCategory);
      }
    }

    return {
      categories: [...categories].sort((a, b) => a.localeCompare(b, 'vi')),
      subcategories: [...subcategories].sort((a, b) => a.localeCompare(b, 'vi')),
      subcategoriesByCategory: Object.fromEntries(
        Object.entries(subcategoriesByCategory).map(([categoryName, values]) => [
          categoryName,
          [...values].sort((a, b) => a.localeCompare(b, 'vi'))
        ])
      )
    };
  }

  async adminStats() {
    const activeFilter = { isActive: true };
    const [total, active, hidden, lowStock, outOfStock, bestseller] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ ...activeFilter, stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ ...activeFilter, stock: { $lte: 0 } }),
      Product.countDocuments({ soldCount: { $gt: 0 } })
    ]);

    return {
      total,
      active,
      hidden,
      lowStock,
      outOfStock,
      bestseller
    };
  }

  async filterOptions() {
    const docs = await Product.find(
      { isActive: true },
      { brand: 1, category_level_1: 1, category_level_2: 1, _id: 0 }
    ).lean();

    const brandSet = new Set();
    const categorySet = new Set();

    for (const doc of docs) {
      const brand = normalizeText(doc.brand);
      if (brand) brandSet.add(brand);

      const category = normalizeText(doc.category_level_2) || normalizeText(doc.category_level_1);
      if (category) categorySet.add(category);
    }

    return {
      categories: [...categorySet].sort((a, b) => a.localeCompare(b, 'vi')),
      brands: [...brandSet].sort((a, b) => a.localeCompare(b, 'vi'))
    };
  }

  async lowStock(limit = 5) {
    const normalizedLimit = Math.min(toPositiveInteger(limit, 5), 50);
    return Product.find({ isActive: true, stock: { $lte: 10 } })
      .sort({ stock: 1, soldCount: -1, updatedAt: -1 })
      .limit(normalizedLimit);
  }

  async count() {
    return Product.countDocuments({ isActive: true });
  }

  async topSelling(limit = 10) {
    return Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(limit);
  }
}

const normalizeSort = (sort) => {
  const allowed = new Set([
    'sale_price',
    '-sale_price',
    'rating',
    '-rating',
    'createdAt',
    '-createdAt',
    'soldCount',
    '-soldCount'
  ]);
  const selected = allowed.has(sort) ? sort : '-createdAt';
  const direction = selected.startsWith('-') ? -1 : 1;
  const field = selected.replace('-', '');
  return { [field]: direction };
};

const resolveProductSearchFilter = async (filter, searchQuery) => {
  if (!searchQuery) return filter;

  if (searchQuery.preferred) {
    const preferredFilter = combineFilters(filter, searchQuery.preferred);
    if (await Product.exists(preferredFilter)) {
      return preferredFilter;
    }
  }

  const strongFilter = combineFilters(filter, searchQuery.strong);
  if (searchQuery.tokens.length === 1 || (await Product.exists(strongFilter))) {
    return strongFilter;
  }

  return combineFilters(filter, searchQuery.fallback);
};

const combineFilters = (filter, searchFilter) => ({
  $and: [filter, searchFilter]
});

const escapeRegExp = escapeRegex;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const toOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
};

const normalizeText = (value) => {
  const text = String(value || '').trim();
  return text || '';
};

module.exports = MongoProductRepository;
