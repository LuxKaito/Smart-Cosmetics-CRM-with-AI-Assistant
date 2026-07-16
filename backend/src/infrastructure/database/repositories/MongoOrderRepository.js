const Order = require('../models/OrderModel');
const { PAYMENT_STATUSES, ORDER_STATUSES } = require('../../../shared/constants/order');

class MongoOrderRepository {
  async create(data) {
    return Order.create(data);
  }

  async findById(id) {
    return Order.findById(id).populate('items.productId');
  }

  async findRawById(id) {
    return Order.findById(id);
  }

  async findByUserId(userId) {
    return Order.find({ user: userId }).sort({ createdAt: -1 }).populate('items.productId');
  }

  async findDeliveredByUserAndProduct(userId, productId) {
    return Order.findOne({
      user: userId,
      orderStatus: ORDER_STATUSES.DELIVERED,
      'items.productId': productId
    }).sort({ createdAt: -1 });
  }

  async list({ page = 1, limit = 20, search, paymentStatus, orderStatus, paymentMethod, dateFrom, dateTo } = {}) {
    const normalizedPage = toPositiveInteger(page, 1);
    const normalizedLimit = Math.min(toPositiveInteger(limit, 20), 100);
    const filter = buildOrderFilter({ search, paymentStatus, orderStatus, paymentMethod, dateFrom, dateTo });

    const skip = (normalizedPage - 1) * normalizedLimit;
    const [items, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .populate('user', 'name email role'),
      Order.countDocuments(filter)
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

  async findByPayosOrderCode(payosOrderCode) {
    return Order.findOne({ payosOrderCode });
  }

  async updateById(id, data) {
    return Order.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async countByStatus({ dateFrom, dateTo } = {}) {
    return Order.aggregate([
      { $match: buildOrderFilter({ dateFrom, dateTo }) },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async countByPaymentMethod({ dateFrom, dateTo } = {}) {
    return Order.aggregate([
      { $match: buildOrderFilter({ dateFrom, dateTo }) },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async adminStats({ dateFrom, dateTo } = {}) {
    const filter = buildOrderFilter({ dateFrom, dateTo });
    const [total, pending, processing, shipping, completed, cancelled] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, orderStatus: { $in: [ORDER_STATUSES.PENDING_PAYMENT, ORDER_STATUSES.PENDING_CONFIRMATION] } }),
      Order.countDocuments({ ...filter, orderStatus: ORDER_STATUSES.CONFIRMED }),
      Order.countDocuments({ ...filter, orderStatus: ORDER_STATUSES.SHIPPING }),
      Order.countDocuments({ ...filter, orderStatus: ORDER_STATUSES.DELIVERED }),
      Order.countDocuments({ ...filter, orderStatus: ORDER_STATUSES.CANCELLED })
    ]);

    return { total, pending, processing, shipping, completed, cancelled };
  }

  async overviewSummary({ dateFrom, dateTo } = {}) {
    const result = await Order.aggregate([
      { $match: buildOrderFilter({ dateFrom, dateTo }) },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [isRevenueOrderExpression(), '$totalAmount', 0]
            }
          },
          totalOrders: { $sum: 1 },
          soldProducts: {
            $sum: {
              $cond: [
                isRevenueOrderExpression(),
                { $sum: '$items.quantity' },
                0
              ]
            }
          }
        }
      }
    ]);

    const summary = result[0] || {};
    return {
      totalRevenue: summary.totalRevenue || 0,
      totalOrders: summary.totalOrders || 0,
      soldProducts: summary.soldProducts || 0,
      averageOrderValue: summary.totalOrders ? Math.round((summary.totalRevenue || 0) / summary.totalOrders) : 0
    };
  }

  async revenueByDay({ dateFrom, dateTo } = {}) {
    return Order.aggregate([
      { $match: { ...buildOrderFilter({ dateFrom, dateTo }), ...revenueMatchFilter() } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
  }

  async count() {
    return Order.countDocuments();
  }

  async revenue() {
    const result = await Order.aggregate([
      { $match: revenueMatchFilter() },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async monthlyRevenue(year = new Date().getFullYear()) {
    return Order.aggregate([
      {
        $match: {
          ...revenueMatchFilter(),
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lte: new Date(`${year}-12-31T23:59:59.999Z`)
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);
  }

  async topSellingProducts(limit = 5, { dateFrom, dateTo } = {}) {
    return Order.aggregate([
      {
        $match: {
          ...buildOrderFilter({ dateFrom, dateTo }),
          ...revenueMatchFilter()
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productNameSnapshot' },
          image: { $first: '$items.imageSnapshot' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' }
        }
      },
      { $sort: { unitsSold: -1, revenue: -1 } },
      { $limit: Number(limit) || 5 }
    ]);
  }
}

const revenueMatchFilter = () => ({
  $and: [
    { orderStatus: { $ne: ORDER_STATUSES.CANCELLED } },
    {
      $or: [
        { paymentStatus: PAYMENT_STATUSES.PAID },
        { orderStatus: { $in: [ORDER_STATUSES.SHIPPING, ORDER_STATUSES.DELIVERED] } }
      ]
    }
  ]
});

const isRevenueOrderExpression = () => ({
  $and: [
    { $ne: ['$orderStatus', ORDER_STATUSES.CANCELLED] },
    {
      $or: [
        { $eq: ['$paymentStatus', PAYMENT_STATUSES.PAID] },
        { $in: ['$orderStatus', [ORDER_STATUSES.SHIPPING, ORDER_STATUSES.DELIVERED]] }
      ]
    }
  ]
});

const buildOrderFilter = ({ search, paymentStatus, orderStatus, paymentMethod, dateFrom, dateTo } = {}) => {
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const createdAt = {};
  const from = normalizeDate(dateFrom, false);
  const to = normalizeDate(dateTo, true);
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;

  if (search) {
    const keyword = String(search).trim();
    const codeKeyword = keyword.replace(/^#/, '');
    const keywordRegex = { $regex: escapeRegExp(keyword), $options: 'i' };
    const codeRegex = { $regex: escapeRegExp(codeKeyword), $options: 'i' };
    filter.$or = [
      { orderCode: codeRegex },
      { note: keywordRegex },
      { voucherCode: keywordRegex },
      { 'shippingAddress.fullName': keywordRegex },
      { 'shippingAddress.phone': keywordRegex }
    ];
    if (/^[a-fA-F0-9]{1,24}$/.test(keyword)) {
      filter.$or.push({
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: escapeRegExp(keyword),
            options: 'i'
          }
        }
      });
    }
  }

  return filter;
};

const normalizeDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(0, 0, 0, 0);
  return date;
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = MongoOrderRepository;
