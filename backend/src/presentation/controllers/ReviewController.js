const { success } = require('../../shared/utils/apiResponse');

class ReviewController {
  constructor(reviewService) {
    this.reviewService = reviewService;
  }

  listForProduct = async (req, res) => {
    const data = await this.reviewService.listForProduct(req.params.productId, req.user);
    return success(res, data);
  };

  create = async (req, res) => {
    const data = await this.reviewService.create(req.params.productId, req.user, req.body);
    return success(res, data, 'Đánh giá sản phẩm thành công', 201);
  };
}

module.exports = ReviewController;
