const Order = require('../models/OrderModel');

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

  async findByPayosOrderCode(payosOrderCode) {
    return Order.findOne({ payosOrderCode });
  }

  async updateById(id, data) {
    return Order.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async count() {
    return Order.countDocuments();
  }

  async revenue() {
    const result = await Order.aggregate([
      { $match: { $or: [{ paymentStatus: 'PAID' }, { status: { $in: ['paid', 'shipping', 'completed'] } }] } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async monthlyRevenue(year = new Date().getFullYear()) {
    return Order.aggregate([
      {
        $match: {
          $or: [{ paymentStatus: 'PAID' }, { status: { $in: ['paid', 'shipping', 'completed'] } }],
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
}

module.exports = MongoOrderRepository;
