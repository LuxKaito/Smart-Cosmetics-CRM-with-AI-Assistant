const Product = require('../models/ProductModel');

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
      category,
      subcategory,
      brand,
      skin_type,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      includeInactive = false
    } = query;

    const keyword = String(search || q || '').trim();
    const normalizedPage = toPositiveInteger(page, 1);
    const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);

    const filter = {};
    if (!includeInactive) filter.isActive = true;

    if (category) {
      const categoryRegex = new RegExp(`^${escapeRegExp(category)}$`, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ category: categoryRegex }, { categories: categoryRegex }]
      });
    }

    if (subcategory) {
      const subcategoryRegex = new RegExp(`^${escapeRegExp(subcategory)}$`, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ subcategory: subcategoryRegex }, { categories: subcategoryRegex }]
      });
    }

    if (brand) filter.brand = new RegExp(`^${escapeRegExp(brand)}$`, 'i');
    if (skin_type) filter.skin_type = new RegExp(`^${escapeRegExp(skin_type)}$`, 'i');

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.sale_price = {};
      if (minPrice !== undefined) filter.sale_price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.sale_price.$lte = Number(maxPrice);
    }

    if (keyword) {
      const keywordRegex = new RegExp(escapeRegExp(keyword), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: keywordRegex },
          { product_name_vn: keywordRegex },
          { product_name_en: keywordRegex },
          { brand: keywordRegex },
          { category: keywordRegex },
          { subcategory: keywordRegex },
          { categories: keywordRegex }
        ]
      });
    }

    const skip = (normalizedPage - 1) * normalizedLimit;
    const sortObject = normalizeSort(sort);

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObject).skip(skip).limit(normalizedLimit),
      Product.countDocuments(filter)
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
      { category: 1, subcategory: 1, categories: 1, _id: 0 }
    ).lean();

    const categories = new Set();
    const subcategories = new Set();
    const subcategoriesByCategory = {};

    for (const doc of docs) {
      const mainCategory = normalizeText(doc.category) || normalizeText(doc.categories?.[0]);
      const childCategory = normalizeText(doc.subcategory) || normalizeText(doc.categories?.[1]);

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
    'price',
    '-price',
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
  const mappedField = field === 'price' ? 'sale_price' : field;
  return { [mappedField]: direction };
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const normalizeText = (value) => {
  const text = String(value || '').trim();
  return text || '';
};

module.exports = MongoProductRepository;
