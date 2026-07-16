const request = require('supertest');
const createApp = require('../../src/app');

const productId = '507f1f77bcf86cd799439011';

const makeContainer = () => ({
  tokenService: {
    verifyAccessToken: jest.fn().mockReturnValue({ sub: 'customer-1' })
  },
  userRepository: {
    findById: jest.fn().mockResolvedValue({
      _id: 'customer-1',
      email: 'customer@example.com',
      role: 'customer',
      isBlocked: false
    })
  },
  authController: {},
  productController: {},
  cartController: {},
  adminController: {},
  checkoutController: {},
  orderController: {},
  paymentController: {},
  reviewController: {
    listForProduct: jest.fn((req, res) =>
      res.json({
        success: true,
        data: {
          items: [],
          eligibility: { canReview: false, reason: 'AUTH_REQUIRED' }
        }
      })
    ),
    create: jest.fn((req, res) =>
      res.status(201).json({
        success: true,
        data: {
          review: {
            productId: req.params.productId,
            userId: req.user._id,
            rating: req.body.rating
          }
        }
      })
    )
  }
});

describe('Review routes', () => {
  it('allows public review listing', async () => {
    const app = createApp(makeContainer());

    const response = await request(app).get(`/api/v1/reviews/products/${productId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('requires authentication when creating a review', async () => {
    const app = createApp(makeContainer());

    const response = await request(app)
      .post(`/api/v1/reviews/products/${productId}`)
      .send({ rating: 5, comment: 'Tốt' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('creates a review with the authenticated user from the access token', async () => {
    const container = makeContainer();
    const app = createApp(container);

    const response = await request(app)
      .post(`/api/v1/reviews/products/${productId}`)
      .set('Authorization', 'Bearer valid-token')
      .send({
        rating: 5,
        comment: 'Tốt',
        userEmail: 'spoofed@example.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.review.userId).toBe('customer-1');
    expect(container.reviewController.create).toHaveBeenCalled();
  });
});
