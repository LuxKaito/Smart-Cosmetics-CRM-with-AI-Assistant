const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');

class ReviewService {
  constructor({ reviewRepository, orderRepository, productRepository }) {
    this.reviewRepository = reviewRepository;
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
  }

  async listForProduct(productId, currentUser = null) {
    await this.requireProduct(productId);

    const [items, eligibility] = await Promise.all([
      this.reviewRepository.listByProduct(productId),
      this.getEligibility(productId, currentUser)
    ]);

    return {
      items: (items || []).map((review) => toPlain(review)),
      eligibility
    };
  }

  async create(productId, user, payload) {
    await this.requireProduct(productId);
    this.requireCustomer(user);

    const existing = await this.reviewRepository.findByUserAndProduct(user._id, productId);
    if (existing) {
      throw new AppError('Bạn đã đánh giá sản phẩm này.', 409, 'REVIEW_ALREADY_EXISTS');
    }

    const purchasedOrder = await this.orderRepository.findDeliveredByUserAndProduct(user._id, productId);
    if (!purchasedOrder) {
      throw new AppError(
        'Bạn chỉ có thể đánh giá sản phẩm đã mua và giao hàng thành công.',
        403,
        'REVIEW_PURCHASE_REQUIRED'
      );
    }

    const review = await this.reviewRepository.create({
      product: productId,
      user: user._id,
      order: purchasedOrder._id,
      userName: user.name || user.email,
      userEmail: user.email,
      rating: payload.rating,
      comment: payload.comment || '',
      verifiedPurchase: true
    });

    const summary = await this.reviewRepository.summaryByProduct(productId);
    await this.productRepository.updateReviewSummary(productId, summary);

    return {
      review: toPlain(review),
      summary
    };
  }

  async getEligibility(productId, user) {
    if (!user) {
      return {
        canReview: false,
        reason: 'AUTH_REQUIRED'
      };
    }

    if (user.role !== ROLES.CUSTOMER) {
      return {
        canReview: false,
        reason: 'CUSTOMER_REQUIRED'
      };
    }

    const existing = await this.reviewRepository.findByUserAndProduct(user._id, productId);
    if (existing) {
      return {
        canReview: false,
        reason: 'REVIEW_ALREADY_EXISTS'
      };
    }

    const purchasedOrder = await this.orderRepository.findDeliveredByUserAndProduct(user._id, productId);
    if (!purchasedOrder) {
      return {
        canReview: false,
        reason: 'REVIEW_PURCHASE_REQUIRED'
      };
    }

    return {
      canReview: true,
      reason: null
    };
  }

  async requireProduct(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product || product.isActive === false) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  requireCustomer(user) {
    if (!user) throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    if (user.role !== ROLES.CUSTOMER) {
      throw new AppError('Customer access required', 403, 'CUSTOMER_REQUIRED');
    }
  }
}

const toPlain = (value) => (value && value.toObject ? value.toObject() : value);

module.exports = ReviewService;
