const { success } = require('../../shared/utils/apiResponse');

class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  create = async (req, res) => {
    const result = await this.orderService.createOrder(req.user._id.toString(), req.body);
    return success(res, result, 'Order created successfully', 201);
  };

  listMyOrders = async (req, res) => {
    const orders = await this.orderService.getMyOrders(req.user._id.toString());
    return success(res, { orders });
  };

  detail = async (req, res) => {
    const order = await this.orderService.getOrderByIdForUser(req.user._id.toString(), req.params.id);
    return success(res, { order });
  };

  cancel = async (req, res) => {
    const order = await this.orderService.cancelOrderByUser(
      req.user._id.toString(),
      req.params.id,
      req.body.reason
    );
    return success(res, { order }, 'Order cancelled');
  };
}

module.exports = OrderController;
