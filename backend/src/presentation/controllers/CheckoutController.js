const { success } = require('../../shared/utils/apiResponse');

class CheckoutController {
  constructor(checkoutService, addressLookupService) {
    this.checkoutService = checkoutService;
    this.addressLookupService = addressLookupService;
  }

  summary = async (req, res) => {
    const summary = await this.checkoutService.getSummary(req.user._id.toString(), {
      province: req.query?.province
    });
    return success(res, summary);
  };

  suggestAddress = async (req, res) => {
    const suggestions = await this.addressLookupService.suggest(req.query?.q);
    return success(res, { suggestions });
  };

  addressDetail = async (req, res) => {
    const address = await this.addressLookupService.detail(req.query?.placeId);
    return success(res, { address });
  };
}

module.exports = CheckoutController;
