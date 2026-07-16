const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');
const {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ORDER_STATUSES
} = require('../../shared/constants/order');

class StaffService {
  constructor({ userRepository, orderRepository }) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
  }

  async overview() {
    const [orders, customers] = await Promise.all([
      this.orderRepository.adminStats(),
      this.userRepository.customerAccountStats()
    ]);

    return { orders, customers };
  }

  async listOrders(query) {
    const [result, stats] = await Promise.all([
      this.orderRepository.list(query),
      this.orderRepository.adminStats(query)
    ]);

    return {
      ...result,
      items: (result.items || []).map((item) => toPlain(item)),
      stats
    };
  }

  async getOrderDetail(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    return toPlain(order);
  }

  async confirmOrder(orderId) {
    return this.transitionOrder(orderId, ORDER_STATUSES.CONFIRMED);
  }

  async updateOrderStatus(orderId, nextStatus) {
    return this.transitionOrder(orderId, nextStatus);
  }

  async transitionOrder(orderId, nextStatus) {
    const order = await this.orderRepository.findRawById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if ([ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED].includes(order.orderStatus)) {
      throw new AppError('Completed or cancelled orders cannot be changed', 400, 'ORDER_STATUS_LOCKED');
    }

    const allowedNext = {
      [ORDER_STATUSES.PENDING_PAYMENT]: [ORDER_STATUSES.CONFIRMED],
      [ORDER_STATUSES.PENDING_CONFIRMATION]: [ORDER_STATUSES.CONFIRMED],
      [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.SHIPPING],
      [ORDER_STATUSES.SHIPPING]: [ORDER_STATUSES.DELIVERED]
    };

    if (!allowedNext[order.orderStatus]?.includes(nextStatus)) {
      throw new AppError('Invalid order status transition', 400, 'INVALID_ORDER_STATUS_TRANSITION');
    }

    const payload = { orderStatus: nextStatus };
    if (nextStatus === ORDER_STATUSES.DELIVERED && order.paymentMethod === PAYMENT_METHODS.COD) {
      payload.paymentStatus = PAYMENT_STATUSES.PAID;
      payload.paidAt = new Date();
    }

    const updated = await this.orderRepository.updateById(orderId, payload);
    return toPlain(updated);
  }

  async cancelOrder(orderId, reason = '') {
    const order = await this.orderRepository.findRawById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if ([ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED].includes(order.orderStatus)) {
      throw new AppError('Order cannot be cancelled', 400, 'ORDER_CANNOT_BE_CANCELLED');
    }

    const updated = await this.orderRepository.updateById(orderId, {
      orderStatus: ORDER_STATUSES.CANCELLED,
      paymentStatus: order.paymentStatus === PAYMENT_STATUSES.PAID ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.CANCELLED,
      paymentFailureReason: reason || 'STAFF_CANCELLED',
      cancelledAt: new Date()
    });

    return toPlain(updated);
  }

  async listCustomers(query) {
    const scopedQuery = {
      ...query,
      role: ROLES.CUSTOMER
    };
    const [result, stats] = await Promise.all([
      this.userRepository.list(scopedQuery),
      this.userRepository.customerAccountStats()
    ]);

    return {
      ...result,
      items: (result.items || []).map((item) => toSafeUser(item)),
      stats
    };
  }

  async getCustomerDetail(customerId) {
    const customer = await this.requireCustomer(customerId);
    return toSafeUser(customer);
  }

  async getCustomerOrders(customerId) {
    await this.requireCustomer(customerId);
    const orders = await this.orderRepository.findByUserId(customerId);
    return orders.map((order) => toPlain(order));
  }

  async requireCustomer(customerId) {
    const customer = await this.userRepository.findById(customerId);
    if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    if (customer.role !== ROLES.CUSTOMER) {
      throw new AppError('Only customer accounts are available from staff endpoints', 400, 'INVALID_CUSTOMER_TARGET');
    }
    return customer;
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

module.exports = StaffService;
