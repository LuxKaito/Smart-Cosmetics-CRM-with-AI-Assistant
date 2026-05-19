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

  async list({ page = 1, limit = 20, role, search }) {
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.email = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
    };
  }

  async count() {
    return User.countDocuments();
  }
}

module.exports = MongoUserRepository;
