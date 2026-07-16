const { success } = require('../../shared/utils/apiResponse');

class StaffController {
  constructor(staffService) {
    this.staffService = staffService;
  }

  overview = async (req, res) => {
    const data = await this.staffService.overview();
    return success(res, data);
  };

  listOrders = async (req, res) => {
    const data = await this.staffService.listOrders(req.query);
    return success(res, data);
  };

  getOrderDetail = async (req, res) => {
    const order = await this.staffService.getOrderDetail(req.params.id);
    return success(res, { order });
  };

  updateOrderStatus = async (req, res) => {
    const order = await this.staffService.updateOrderStatus(req.params.id, req.body.orderStatus);
    return success(res, { order }, 'Order status updated');
  };

  confirmOrder = async (req, res) => {
    const order = await this.staffService.confirmOrder(req.params.id);
    return success(res, { order }, 'Order confirmed');
  };

  cancelOrder = async (req, res) => {
    const order = await this.staffService.cancelOrder(req.params.id, req.body.reason);
    return success(res, { order }, 'Order cancelled');
  };

  listCustomers = async (req, res) => {
    const data = await this.staffService.listCustomers(req.query);
    return success(res, data);
  };

  getCustomerDetail = async (req, res) => {
    const customer = await this.staffService.getCustomerDetail(req.params.id);
    return success(res, { customer });
  };

  getCustomerOrders = async (req, res) => {
    const orders = await this.staffService.getCustomerOrders(req.params.id);
    return success(res, { orders });
  };
}

module.exports = StaffController;
