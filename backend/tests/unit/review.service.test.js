const ReviewService = require('../../src/application/services/ReviewService');

const product = { _id: 'product-1', isActive: true };
const customer = {
  _id: 'customer-1',
  email: 'customer@example.com',
  name: 'Customer Demo',
  role: 'customer'
};

const makeService = ({
  existingReview = null,
  purchasedOrder = { _id: 'order-1' }
} = {}) => {
  const reviewRepository = {
    findByUserAndProduct: jest.fn().mockResolvedValue(existingReview),
    create: jest.fn().mockResolvedValue({
      _id: 'review-1',
      product: product._id,
      user: customer._id,
      order: purchasedOrder?._id,
      rating: 5,
      comment: 'Tốt'
    }),
    summaryByProduct: jest.fn().mockResolvedValue({ rating: 5, reviewCount: 1 })
  };
  const orderRepository = {
    findDeliveredByUserAndProduct: jest.fn().mockResolvedValue(purchasedOrder)
  };
  const productRepository = {
    findById: jest.fn().mockResolvedValue(product),
    updateReviewSummary: jest.fn().mockResolvedValue(product)
  };

  return {
    service: new ReviewService({ reviewRepository, orderRepository, productRepository }),
    reviewRepository,
    orderRepository,
    productRepository
  };
};

describe('ReviewService', () => {
  it('creates a verified review for a customer with a delivered order', async () => {
    const { service, reviewRepository, productRepository } = makeService();

    const result = await service.create(product._id, customer, {
      rating: 5,
      comment: 'Tốt'
    });

    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: product._id,
        user: customer._id,
        order: 'order-1',
        verifiedPurchase: true
      })
    );
    expect(productRepository.updateReviewSummary).toHaveBeenCalledWith(product._id, {
      rating: 5,
      reviewCount: 1
    });
    expect(result.review._id).toBe('review-1');
  });

  it('rejects reviews when the customer has no delivered order for the product', async () => {
    const { service } = makeService({ purchasedOrder: null });

    await expect(
      service.create(product._id, customer, { rating: 4, comment: '' })
    ).rejects.toMatchObject({
      code: 'REVIEW_PURCHASE_REQUIRED'
    });
  });

  it('rejects duplicate reviews for the same customer and product', async () => {
    const { service } = makeService({ existingReview: { _id: 'existing-review' } });

    await expect(
      service.create(product._id, customer, { rating: 4, comment: '' })
    ).rejects.toMatchObject({
      code: 'REVIEW_ALREADY_EXISTS'
    });
  });
});
