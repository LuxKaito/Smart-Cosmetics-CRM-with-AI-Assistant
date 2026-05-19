const env = require('../../config/env');
const AppError = require('../../shared/errors/AppError');
const {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ORDER_STATUSES
} = require('../../shared/constants/order');

class OrderService {
  constructor({
    orderRepository,
    checkoutService,
    cartRepository,
    productRepository,
    payosClient,
    eventPublisher
  }) {
    this.orderRepository = orderRepository;
    this.checkoutService = checkoutService;
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.payosClient = payosClient;
    this.eventPublisher = eventPublisher;
  }

  async createOrder(userId, payload) {
    const summary = await this.checkoutService.getSummary(userId, {
      shippingAddress: payload.shippingAddress
    });

    const baseOrderData = {
      user: userId,
      items: summary.items.map((item) => ({
        productId: item.productId,
        productNameSnapshot: item.name,
        imageSnapshot: item.image,
        quantity: item.quantity,
        priceSnapshot: item.unitPrice,
        lineTotal: item.lineTotal,
        product: item.productId,
        name: item.name,
        price: item.unitPrice
      })),
      shippingAddress: payload.shippingAddress,
      note: payload.note || '',
      voucherCode: payload.voucherCode || '',
      subtotal: summary.subtotal,
      discount: summary.discount,
      shippingFee: summary.shippingFee,
      totalAmount: summary.total,
      paymentMethod: payload.paymentMethod
    };

    if (payload.paymentMethod === PAYMENT_METHODS.COD) {
      const order = await this.orderRepository.create({
        ...baseOrderData,
        paymentStatus: PAYMENT_STATUSES.UNPAID,
        orderStatus: ORDER_STATUSES.PENDING_CONFIRMATION
      });

      await this.reserveStock(order);
      await this.cartRepository.clearItemsByOwner({ userId });
      await this.eventPublisher.publishOrderCreated({
        orderId: order._id.toString(),
        userId,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount
      });

      return {
        order: sanitizeOrder(order),
        successUrl: `${env.frontendBaseUrl}/checkout/success?orderId=${order._id.toString()}`
      };
    }

    if (payload.paymentMethod !== PAYMENT_METHODS.PAYOS) {
      throw new AppError('Unsupported payment method', 400, 'UNSUPPORTED_PAYMENT_METHOD');
    }

    const payosOrderCode = generatePayosOrderCode();
    const pendingOrder = await this.orderRepository.create({
      ...baseOrderData,
      paymentStatus: PAYMENT_STATUSES.PENDING,
      orderStatus: ORDER_STATUSES.PENDING_PAYMENT,
      payosOrderCode
    });

    const payment = await this.payosClient.createPaymentLink({
      orderCode: payosOrderCode,
      amount: pendingOrder.totalAmount,
      description: `LuxBerry #${pendingOrder._id.toString().slice(-8)}`,
      returnUrl: env.payosReturnUrl,
      cancelUrl: env.payosCancelUrl,
      items: pendingOrder.items.map((item) => ({
        name: item.productNameSnapshot,
        quantity: item.quantity,
        price: item.priceSnapshot
      }))
    });

    const order = await this.orderRepository.updateById(pendingOrder._id, {
      paymentStatus: PAYMENT_STATUSES.PENDING,
      orderStatus: ORDER_STATUSES.PENDING_PAYMENT,
      payosOrderCode: payment.payosOrderCode,
      payosCheckoutUrl: payment.checkoutUrl,
      payosPaymentLinkId: payment.paymentLinkId
    });

    await this.eventPublisher.publishOrderCreated({
      orderId: order._id.toString(),
      userId,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount
    });
    await this.eventPublisher.publishPaymentPending({
      orderId: order._id.toString(),
      userId,
      payosOrderCode: order.payosOrderCode,
      amount: order.totalAmount
    });

    return {
      order: sanitizeOrder(order),
      checkoutUrl: payment.checkoutUrl
    };
  }

  async getMyOrders(userId) {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.map((order) => sanitizeOrder(order));
  }

  async getOrderByIdForUser(userId, orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.user.toString() !== userId.toString()) {
      throw new AppError('Permission denied', 403, 'FORBIDDEN');
    }
    return sanitizeOrder(order);
  }

  async cancelOrderByUser(userId, orderId, reason = '') {
    const order = await this.orderRepository.findRawById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.user.toString() !== userId.toString()) {
      throw new AppError('Permission denied', 403, 'FORBIDDEN');
    }
    if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
      throw new AppError('Paid orders cannot be cancelled by customer', 400, 'ORDER_CANNOT_BE_CANCELLED');
    }

    const updatedOrder = await this.orderRepository.updateById(order._id, {
      paymentStatus: PAYMENT_STATUSES.CANCELLED,
      orderStatus: ORDER_STATUSES.CANCELLED,
      paymentFailureReason: reason || 'USER_CANCELLED',
      cancelledAt: new Date()
    });

    await this.eventPublisher.publishOrderCancelled({
      orderId: updatedOrder._id.toString(),
      userId: updatedOrder.user.toString(),
      reason: updatedOrder.paymentFailureReason
    });

    return sanitizeOrder(updatedOrder);
  }

  async createPayOSPaymentForOrder(userId, orderId) {
    const order = await this.orderRepository.findRawById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.user.toString() !== userId.toString()) throw new AppError('Permission denied', 403, 'FORBIDDEN');
    if (order.paymentMethod !== PAYMENT_METHODS.PAYOS) {
      throw new AppError('Order is not configured for payOS', 400, 'ORDER_NOT_PAYOS');
    }
    if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
      throw new AppError('Order has been paid', 400, 'ORDER_ALREADY_PAID');
    }

    const payosOrderCode = order.payosOrderCode || generatePayosOrderCode();
    const payment = await this.payosClient.createPaymentLink({
      orderCode: payosOrderCode,
      amount: order.totalAmount,
      description: `LuxBerry #${order._id.toString().slice(-8)}`,
      returnUrl: env.payosReturnUrl,
      cancelUrl: env.payosCancelUrl,
      items: order.items.map((item) => ({
        name: item.productNameSnapshot,
        quantity: item.quantity,
        price: item.priceSnapshot
      }))
    });

    const updatedOrder = await this.orderRepository.updateById(order._id, {
      paymentStatus: PAYMENT_STATUSES.PENDING,
      orderStatus: ORDER_STATUSES.PENDING_PAYMENT,
      payosOrderCode: payment.payosOrderCode,
      payosCheckoutUrl: payment.checkoutUrl,
      payosPaymentLinkId: payment.paymentLinkId
    });

    await this.eventPublisher.publishPaymentPending({
      orderId: updatedOrder._id.toString(),
      userId: updatedOrder.user.toString(),
      payosOrderCode: updatedOrder.payosOrderCode,
      amount: updatedOrder.totalAmount
    });

    return {
      order: sanitizeOrder(updatedOrder),
      checkoutUrl: payment.checkoutUrl
    };
  }

  async markPaymentSuccessByOrderCode(orderCode, payload = {}) {
    const order = await this.orderRepository.findByPayosOrderCode(Number(orderCode));
    if (!order) throw new AppError('Order not found for payOS callback', 404, 'ORDER_NOT_FOUND');

    if (order.paymentStatus === PAYMENT_STATUSES.PAID) {
      return sanitizeOrder(order);
    }

    await this.reserveStock(order);
    const updatedOrder = await this.orderRepository.updateById(order._id, {
      paymentStatus: PAYMENT_STATUSES.PAID,
      orderStatus: ORDER_STATUSES.PENDING_CONFIRMATION,
      paidAt: new Date(),
      paymentFailureReason: ''
    });

    await this.cartRepository.clearItemsByOwner({ userId: updatedOrder.user.toString() });
    await this.eventPublisher.publishPaymentSuccess({
      orderId: updatedOrder._id.toString(),
      userId: updatedOrder.user.toString(),
      payosOrderCode: updatedOrder.payosOrderCode,
      amount: updatedOrder.totalAmount,
      metadata: payload
    });

    return sanitizeOrder(updatedOrder);
  }

  async markPaymentFailedByOrderCode(orderCode, payload = {}, cancelled = false) {
    const order = await this.orderRepository.findByPayosOrderCode(Number(orderCode));
    if (!order) throw new AppError('Order not found for payOS callback', 404, 'ORDER_NOT_FOUND');

    const paymentStatus = cancelled ? PAYMENT_STATUSES.CANCELLED : PAYMENT_STATUSES.FAILED;
    const orderStatus = cancelled ? ORDER_STATUSES.CANCELLED : ORDER_STATUSES.PENDING_PAYMENT;
    const updatedOrder = await this.orderRepository.updateById(order._id, {
      paymentStatus,
      orderStatus,
      paymentFailureReason: payload?.reason || payload?.desc || ''
    });

    if (cancelled) {
      await this.eventPublisher.publishOrderCancelled({
        orderId: updatedOrder._id.toString(),
        userId: updatedOrder.user.toString(),
        reason: updatedOrder.paymentFailureReason || 'cancelled'
      });
    }
    await this.eventPublisher.publishPaymentFailed({
      orderId: updatedOrder._id.toString(),
      userId: updatedOrder.user.toString(),
      payosOrderCode: updatedOrder.payosOrderCode,
      reason: updatedOrder.paymentFailureReason || 'failed',
      cancelled
    });

    return sanitizeOrder(updatedOrder);
  }

  async reserveStock(order) {
    for (const item of order.items) {
      const updated = await this.productRepository.decreaseStock(item.productId, item.quantity);
      if (!updated) {
        throw new AppError(
          `Insufficient stock for product ${item.productNameSnapshot || item.productId}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }
  }
}

const generatePayosOrderCode = () => {
  const now = Number(String(Date.now()).slice(-10));
  const randomPart = Math.floor(Math.random() * 90000) + 10000;
  return Number(`${now}${randomPart}`);
};

const sanitizeOrder = (order) => {
  const source = order?.toObject ? order.toObject() : order;
  return {
    ...source,
    id: source?._id?.toString() || source?.id || null
  };
};

module.exports = OrderService;
