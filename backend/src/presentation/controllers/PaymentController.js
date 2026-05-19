const { success } = require('../../shared/utils/apiResponse');

class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  createPayOSPayment = async (req, res) => {
    const result = await this.paymentService.createPayOSPaymentLink(
      req.user._id.toString(),
      req.body.orderId
    );
    return success(res, result, 'payOS payment link created');
  };

  payosWebhook = async (req, res) => {
    const result = await this.paymentService.handlePayOSWebhook(req.body);
    return success(res, result, 'Webhook processed');
  };

  payosReturn = async (req, res) => {
    const result = await this.paymentService.handlePayOSReturn(req.query);
    if (result?.redirectUrl) return res.redirect(result.redirectUrl);
    return success(res, result);
  };

  payosCancel = async (req, res) => {
    const result = await this.paymentService.handlePayOSCancel(req.query);
    if (result?.redirectUrl) return res.redirect(result.redirectUrl);
    return success(res, result);
  };
}

module.exports = PaymentController;
