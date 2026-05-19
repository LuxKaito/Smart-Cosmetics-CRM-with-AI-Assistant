const { success } = require('../../shared/utils/apiResponse');

class CheckoutController {
  constructor(checkoutService) {
    this.checkoutService = checkoutService;
  }

  summary = async (req, res) => {
    const summary = await this.checkoutService.getSummary(req.user._id.toString(), {
      province: req.query?.province
    });
    return success(res, summary);
  };

}

module.exports = CheckoutController;
