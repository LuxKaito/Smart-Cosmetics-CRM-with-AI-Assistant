const Voucher = require('../models/VoucherModel');

class MongoVoucherRepository {
  async create(data) {
    return Voucher.create(data);
  }

  async findById(id) {
    return Voucher.findById(id);
  }

  async findByCode(code) {
    return Voucher.findOne({ code: String(code || '').trim().toUpperCase() });
  }

  async findByCodes(codes = []) {
    const normalizedCodes = [...new Set((codes || []).map(normalizeVoucherCode).filter(Boolean))];
    if (!normalizedCodes.length) return [];
    return Voucher.find({ code: { $in: normalizedCodes } });
  }

  async updateById(id, data) {
    return Voucher.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async softDeleteById(id) {
    return Voucher.findByIdAndUpdate(
      id,
      {
        isActive: false
      },
      {
        new: true,
        runValidators: true
      }
    );
  }

  async incrementUsedCount(code) {
    if (!code) return null;
    return Voucher.findOneAndUpdate(
      { code: String(code).trim().toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true, runValidators: true }
    );
  }

  async search(query = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      discountType,
      isActive,
      sort = '-createdAt'
    } = query;

    const normalizedPage = toPositiveInteger(page, 1);
    const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);
    const filter = {};

    if (search) {
      const keywordRegex = { $regex: escapeRegExp(search), $options: 'i' };
      filter.$or = [{ code: keywordRegex }, { name: keywordRegex }, { description: keywordRegex }];
    }
    if (discountType) filter.discountType = discountType;
    if (typeof isActive === 'boolean') filter.isActive = isActive;

    const skip = (normalizedPage - 1) * normalizedLimit;
    const sortObject = normalizeSort(sort);

    const [items, total] = await Promise.all([
      Voucher.find(filter).sort(sortObject).skip(skip).limit(normalizedLimit),
      Voucher.countDocuments(filter)
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

  async listPublic({ limit = 12 } = {}) {
    const now = new Date();
    const normalizedLimit = Math.min(toPositiveInteger(limit, 12), 40);
    const filter = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: 0 },
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    };

    return Voucher.find(filter).sort({ endDate: 1, createdAt: -1 }).limit(normalizedLimit);
  }

  async adminStats() {
    const now = new Date();
    const [total, active, inactive, expired, lowUsageLeft] = await Promise.all([
      Voucher.countDocuments(),
      Voucher.countDocuments({ isActive: true, startDate: { $lte: now }, endDate: { $gte: now } }),
      Voucher.countDocuments({ isActive: false }),
      Voucher.countDocuments({ endDate: { $lt: now } }),
      Voucher.countDocuments({
        usageLimit: { $gt: 0 },
        $expr: { $lte: [{ $subtract: ['$usageLimit', '$usedCount'] }, 10] }
      })
    ]);

    return { total, active, inactive, expired, lowUsageLeft };
  }
}

const normalizeSort = (sort) => {
  const allowed = new Set(['code', '-code', 'startDate', '-startDate', 'endDate', '-endDate', 'createdAt', '-createdAt']);
  const selected = allowed.has(sort) ? sort : '-createdAt';
  const direction = selected.startsWith('-') ? -1 : 1;
  const field = selected.replace('-', '');
  return { [field]: direction };
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeVoucherCode = (code) => String(code || '').trim().toUpperCase();

module.exports = MongoVoucherRepository;
