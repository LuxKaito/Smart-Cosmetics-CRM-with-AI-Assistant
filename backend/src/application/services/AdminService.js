const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');
const {
  PAYMENT_METHODS,
  ORDER_STATUSES
} = require('../../shared/constants/order');

class AdminService {
  constructor({ userRepository, productRepository, orderRepository, voucherRepository, productService, passwordService }) {
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.voucherRepository = voucherRepository;
    this.productService = productService;
    this.passwordService = passwordService;
  }

  async listProducts(query) {
    const [result, stats, filters] = await Promise.all([
      this.productRepository.search({
      ...query,
      includeInactive: true
      }),
      this.productRepository.adminStats(),
      this.productRepository.filterOptions()
    ]);

    return {
      ...result,
      items: (result.items || []).map((item) => toPlain(item)),
      stats,
      filters
    };
  }

  async createProduct(payload) {
    return this.productService.create(payload);
  }

  async updateProduct(productId, payload) {
    return this.productService.update(productId, payload);
  }

  async deleteProduct(productId) {
    await this.productService.delete(productId);
    return { deleted: true, disabled: true };
  }

  async listUsers(query) {
    const scopedQuery = {
      ...query,
      roles: query?.role ? undefined : [ROLES.ADMIN, ROLES.STAFF]
    };
    const [result, stats] = await Promise.all([
      this.userRepository.list(scopedQuery),
      this.userRepository.adminStats()
    ]);
    return {
      ...result,
      items: (result.items || []).map((item) => toSafeUser(item)),
      stats
    };
  }

  async createUser(payload) {
    if (!this.passwordService) {
      throw new AppError('Password service is not configured', 500, 'PASSWORD_SERVICE_MISSING');
    }

    const existing = await this.userRepository.findByEmail(payload.email);
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

    const role = payload.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.STAFF;
    const passwordHash = await this.passwordService.hash(payload.password);
    const user = await this.userRepository.create({
      email: String(payload.email).toLowerCase().trim(),
      name: payload.name,
      phone: payload.phone || '',
      department: payload.department || '',
      passwordHash,
      role,
      permissions: [],
      isBlocked: Boolean(payload.isBlocked),
      emailVerified: true
    });

    return toSafeUser(user);
  }

  async updateUser(userId, payload, currentUser) {
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (targetUser.role === ROLES.ADMIN && String(currentUser?._id) !== String(targetUser._id)) {
      throw new AppError('Admin account updates are restricted', 400, 'ADMIN_UPDATE_DENIED');
    }
    if (payload.isBlocked === true && String(currentUser?._id) === String(targetUser._id)) {
      throw new AppError('Admin cannot block their own account', 400, 'SELF_BLOCK_DENIED');
    }

    const user = await this.userRepository.updateById(userId, payload);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return toSafeUser(user);
  }

  async setUserBlocked(userId, isBlocked, currentUser) {
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (String(currentUser?._id) === String(targetUser._id)) {
      throw new AppError('Admin cannot block their own account', 400, 'SELF_BLOCK_DENIED');
    }
    if (targetUser.role === ROLES.ADMIN) {
      throw new AppError('Admin accounts cannot be blocked from this endpoint', 400, 'ADMIN_BLOCK_DENIED');
    }

    const user = await this.userRepository.updateById(userId, { isBlocked });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return toSafeUser(user);
  }

  async assignRole(userId, role) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const payload = { role, permissions: [] };
    const updatedUser = await this.userRepository.updateById(userId, payload);
    if (!updatedUser) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return toSafeUser(updatedUser);
  }

  async listVouchers(query) {
    const [result, stats] = await Promise.all([
      this.voucherRepository.search(query),
      this.voucherRepository.adminStats()
    ]);
    return {
      ...result,
      items: (result.items || []).map((item) => toPlain(item)),
      stats
    };
  }

  async createVoucher(payload) {
    validateVoucherPayload(payload);
    const voucher = await this.voucherRepository.create(payload);
    return toPlain(voucher);
  }

  async updateVoucher(voucherId, payload) {
    const existing = await this.voucherRepository.findById(voucherId);
    if (!existing) throw new AppError('Voucher not found', 404, 'VOUCHER_NOT_FOUND');

    const mergedPayload = { ...toPlain(existing), ...payload };
    validateVoucherPayload(mergedPayload);

    const voucher = await this.voucherRepository.updateById(voucherId, payload);
    if (!voucher) throw new AppError('Voucher not found', 404, 'VOUCHER_NOT_FOUND');
    return toPlain(voucher);
  }

  async deleteVoucher(voucherId) {
    const voucher = await this.voucherRepository.softDeleteById(voucherId);
    if (!voucher) throw new AppError('Voucher not found', 404, 'VOUCHER_NOT_FOUND');
    return { deleted: true, voucher: toPlain(voucher) };
  }

  async overview(query = {}) {
    const range = resolveDateRange(query);
    const [summary, customerStats, orderStatusStats, paymentMethodStats, revenueChart, topSelling, lowStock] =
      await Promise.all([
        this.orderRepository.overviewSummary(range),
        this.userRepository.customerStats(range),
        this.orderRepository.countByStatus(range),
        this.orderRepository.countByPaymentMethod(range),
        this.orderRepository.revenueByDay(range),
        this.orderRepository.topSellingProducts(5, range),
        this.productRepository.lowStock(5)
      ]);

    return {
      ...summary,
      newCustomers: customerStats.newCustomers,
      returningCustomers: customerStats.returningCustomers,
      revenueChart: buildRevenueChart(range, revenueChart),
      orderStatusStats: formatOrderStatusStats(orderStatusStats),
      paymentMethodStats: formatPaymentMethodStats(paymentMethodStats),
      topSellingProducts: topSelling.map((item) => ({
        productId: String(item._id || ''),
        name: item.name || 'Unknown product',
        image: item.image || '',
        unitsSold: item.unitsSold || 0,
        revenue: item.revenue || 0
      })),
      lowStockProducts: lowStock.map((item) => {
        const product = toPlain(item);
        return {
          productId: String(product._id || ''),
          name: product.name || product.product_name_vn || '',
          image: product.image_url || product.images?.[0] || '',
          stock: product.stock || 0,
          soldCount: product.soldCount || 0
        };
      }),
      customerStats
    };
  }

  async statistics(year) {
    const normalizedYear = Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear();
    const [totalRevenue, totalOrders, totalCustomers, totalProducts, topSellingProducts, monthly] = await Promise.all([
      this.orderRepository.revenue(),
      this.orderRepository.count(),
      this.userRepository.countByRoles([ROLES.CUSTOMER]),
      this.productRepository.count(),
      this.orderRepository.topSellingProducts(5),
      this.orderRepository.monthlyRevenue(normalizedYear)
    ]);

    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const found = monthly.find((item) => item._id.month === month);
      return {
        month,
        revenue: found?.revenue || 0,
        orders: found?.orders || 0
      };
    });

    return {
      year: normalizedYear,
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      topSellingProducts: topSellingProducts.map((item) => ({
        productId: String(item._id || ''),
        name: item.name || 'Unknown product',
        image: item.image || '',
        unitsSold: item.unitsSold || 0,
        revenue: item.revenue || 0
      })),
      monthlyRevenue
    };
  }
}

const toPlain = (value) => (value && value.toObject ? value.toObject() : value);

const toSafeUser = (user) => {
  const plain = toPlain(user);
  if (!plain) return plain;
  delete plain.passwordHash;
  delete plain.refreshTokenHash;
  delete plain.emailVerificationTokenHash;
  delete plain.emailVerificationExpires;
  return plain;
};

const resolveDateRange = (query = {}) => {
  const now = new Date();
  let from = null;
  let to = null;

  if (query.preset === 'custom' && (query.dateFrom || query.dateTo)) {
    from = query.dateFrom ? new Date(query.dateFrom) : null;
    to = query.dateTo ? new Date(query.dateTo) : now;
  } else if (query.preset === '30d') {
    to = now;
    from = daysAgo(29, now);
  } else if (query.preset === 'month') {
    to = now;
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    to = now;
    from = daysAgo(6, now);
  }

  if (!from || Number.isNaN(from.getTime())) from = daysAgo(6, now);
  if (!to || Number.isNaN(to.getTime())) to = now;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return {
    dateFrom: from,
    dateTo: to
  };
};

const daysAgo = (days, fromDate = new Date()) => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() - days);
  return date;
};

const buildRevenueChart = (range, rows = []) => {
  const values = new Map(
    rows.map((row) => [
      `${row._id.year}-${String(row._id.month).padStart(2, '0')}-${String(row._id.day).padStart(2, '0')}`,
      row
    ])
  );

  const result = [];
  const cursor = new Date(range.dateFrom);
  while (cursor <= range.dateTo) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const value = values.get(key);
    result.push({
      date: `${String(cursor.getDate()).padStart(2, '0')}/${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      revenue: value?.revenue || 0,
      orders: value?.orders || 0
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

const orderStatusLabels = {
  [ORDER_STATUSES.PENDING_PAYMENT]: 'Chờ thanh toán',
  [ORDER_STATUSES.PENDING_CONFIRMATION]: 'Chờ xác nhận',
  [ORDER_STATUSES.CONFIRMED]: 'Đang xử lý',
  [ORDER_STATUSES.SHIPPING]: 'Đang giao',
  [ORDER_STATUSES.DELIVERED]: 'Hoàn thành',
  [ORDER_STATUSES.CANCELLED]: 'Đã hủy'
};

const paymentMethodLabels = {
  [PAYMENT_METHODS.COD]: 'COD',
  [PAYMENT_METHODS.PAYOS]: 'Thanh toán online'
};

const formatOrderStatusStats = (rows = []) => {
  const total = rows.reduce((sum, item) => sum + Number(item.count || 0), 0);
  return rows.map((item) => ({
    status: item._id,
    label: orderStatusLabels[item._id] || item._id,
    count: item.count || 0,
    percent: total ? Math.round((Number(item.count || 0) / total) * 1000) / 10 : 0
  }));
};

const formatPaymentMethodStats = (rows = []) => {
  const total = rows.reduce((sum, item) => sum + Number(item.count || 0), 0);
  return rows.map((item) => ({
    method: item._id,
    label: paymentMethodLabels[item._id] || item._id,
    count: item.count || 0,
    percent: total ? Math.round((Number(item.count || 0) / total) * 1000) / 10 : 0
  }));
};

const validateVoucherPayload = (voucher) => {
  if (!voucher) return;
  if (voucher.discountType === 'percent' && Number(voucher.discountValue) > 100) {
    throw new AppError('Percent discount cannot exceed 100', 400, 'INVALID_VOUCHER_DISCOUNT');
  }

  const startDate = voucher.startDate ? new Date(voucher.startDate) : null;
  const endDate = voucher.endDate ? new Date(voucher.endDate) : null;
  if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
    throw new AppError('endDate must be greater than or equal to startDate', 400, 'INVALID_VOUCHER_DATE_RANGE');
  }
};

module.exports = AdminService;
