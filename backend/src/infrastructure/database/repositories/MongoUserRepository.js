const User = require('../models/UserModel');

class MongoUserRepository {
  static selectSecrets(query) {
    return query.select('+passwordHash +refreshTokenHash +emailVerificationTokenHash +emailVerificationExpires');
  }

  async create(data) {
    return User.create(data);
  }

  async findById(id, options = {}) {
    let query = User.findById(id);
    if (options.includeSecrets) query = MongoUserRepository.selectSecrets(query);
    return query;
  }

  async findByEmail(email, options = {}) {
    let query = User.findOne({ email: email.toLowerCase() });
    if (options.includeSecrets) query = MongoUserRepository.selectSecrets(query);
    return query;
  }

  async findByEmailVerificationTokenHash(emailVerificationTokenHash, options = {}) {
    let query = User.findOne({ emailVerificationTokenHash });
    if (options.includeSecrets !== false) query = MongoUserRepository.selectSecrets(query);
    return query;
  }

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async list({ page = 1, limit = 20, role, roles, isBlocked, emailVerified, search }) {
    const normalizedPage = toPositiveInteger(page, 1);
    const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);

    const filter = {};
    const roleList = Array.isArray(roles) ? roles.filter(Boolean) : [];
    if (role && roleList.length) filter.role = { $in: [...new Set([role, ...roleList])] };
    else if (role) filter.role = role;
    else if (roleList.length) filter.role = { $in: [...new Set(roleList)] };

    const normalizedIsBlocked = toOptionalBoolean(isBlocked);
    if (typeof normalizedIsBlocked === 'boolean') filter.isBlocked = normalizedIsBlocked;

    const normalizedEmailVerified = toOptionalBoolean(emailVerified);
    if (typeof normalizedEmailVerified === 'boolean') filter.emailVerified = normalizedEmailVerified;

    if (search) {
      const keywordRegex = { $regex: escapeRegExp(search), $options: 'i' };
      filter.$or = [{ email: keywordRegex }, { name: keywordRegex }, { phone: keywordRegex }, { department: keywordRegex }];
    }

    const skip = (normalizedPage - 1) * normalizedLimit;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(normalizedLimit),
      User.countDocuments(filter)
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

  async count() {
    return User.countDocuments();
  }

  async countByRoles(roles = []) {
    const normalizedRoles = Array.isArray(roles) ? roles.filter(Boolean) : [];
    if (!normalizedRoles.length) return User.countDocuments();
    return User.countDocuments({ role: { $in: normalizedRoles } });
  }

  async adminStats() {
    const adminRoles = ['admin', 'staff'];
    const [total, admins, staff, customers, blocked] = await Promise.all([
      User.countDocuments({ role: { $in: adminRoles } }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: { $in: adminRoles }, isBlocked: true })
    ]);

    return { total, admins, staff, customers, blocked };
  }

  async customerAccountStats() {
    const [total, active, blocked, verified, unverified] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', isBlocked: false }),
      User.countDocuments({ role: 'customer', isBlocked: true }),
      User.countDocuments({ role: 'customer', emailVerified: true }),
      User.countDocuments({ role: 'customer', emailVerified: false })
    ]);

    return { total, active, blocked, verified, unverified };
  }

  async customerStats({ from, to, dateFrom, dateTo } = {}) {
    const dateFilter = buildDateFilter(from || dateFrom, to || dateTo);
    const [totalCustomers, newCustomers, customersWithOrders] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', ...dateFilter }),
      User.countDocuments({ role: 'customer', lastLoginAt: { $exists: true, $ne: null } })
    ]);

    const returningCustomers = Math.max(customersWithOrders - newCustomers, 0);
    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      returningRate: totalCustomers ? Math.round((returningCustomers / totalCustomers) * 1000) / 10 : 0
    };
  }

  async addSavedVoucherCode(userId, code) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedVoucherCodes: normalizeVoucherCode(code) } },
      { new: true, runValidators: true }
    );
  }

  async getSavedVoucherCodes(userId) {
    const user = await User.findById(userId).select('savedVoucherCodes');
    return Array.isArray(user?.savedVoucherCodes) ? user.savedVoucherCodes.filter(Boolean) : [];
  }

  async addSavedProductId(userId, productId) {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedProductIds: productId } },
      { new: true, runValidators: true }
    );
  }

  async removeSavedProductId(userId, productId) {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { savedProductIds: productId } },
      { new: true, runValidators: true }
    );
  }

  async getSavedProductIds(userId) {
    const user = await User.findById(userId).select('savedProductIds');
    return Array.isArray(user?.savedProductIds) ? user.savedProductIds.filter(Boolean) : [];
  }
}

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

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeVoucherCode = (code) => String(code || '').trim().toUpperCase();

const buildDateFilter = (from, to) => {
  const createdAt = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return Object.keys(createdAt).length ? { createdAt } : {};
};

module.exports = MongoUserRepository;
