const { success } = require('../../shared/utils/apiResponse');

class VoucherController {
  constructor(voucherService) {
    this.voucherService = voucherService;
  }

  listPublic = async (req, res) => {
    const data = await this.voucherService.listPublic(req.query);
    return success(res, data);
  };

  listMine = async (req, res) => {
    const data = await this.voucherService.listMine(req.user._id.toString());
    return success(res, data);
  };

  save = async (req, res) => {
    const data = await this.voucherService.saveForUser(req.user._id.toString(), req.params.code);
    return success(res, data, 'Voucher saved');
  };
}

module.exports = VoucherController;
