const request = require('supertest');
const createApp = require('../../src/app');

const makeContainer = () => ({
  tokenService: {
    verifyAccessToken: jest.fn()
  },
  userRepository: {
    findById: jest.fn()
  },
  authController: {
    register: jest.fn(),
    login: jest.fn(),
    googleLogin: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    me: jest.fn()
  },
  productController: {
    list: jest.fn(),
    search: jest.fn(),
    listByCategory: jest.fn(),
    categories: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
  },
  cartController: {
    get: jest.fn((req, res) =>
      res.json({ success: true, message: 'Success', data: { cartToken: req.cartOwner.cartToken } })
    ),
    add: jest.fn((req, res) =>
      res.status(201).json({ success: true, message: 'Cart item added', data: { cartToken: req.cartOwner.cartToken } })
    ),
    update: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    merge: jest.fn()
  },
  adminController: {
    dashboard: jest.fn(),
    listUsers: jest.fn(),
    setUserBlocked: jest.fn(),
    assignRole: jest.fn(),
    assignPermissions: jest.fn()
  },
  checkoutController: {
    summary: jest.fn()
  },
  orderController: {
    create: jest.fn(),
    listMyOrders: jest.fn(),
    detail: jest.fn(),
    cancel: jest.fn()
  },
  paymentController: {
    createPayOSPayment: jest.fn(),
    payosWebhook: jest.fn(),
    payosReturn: jest.fn(),
    payosCancel: jest.fn()
  }
});

describe('Cart routes', () => {
  it('allows guest add item and sets cart_token cookie', async () => {
    const app = createApp(makeContainer());

    const response = await request(app)
      .post('/api/v1/cart/items')
      .send({
        productId: '507f1f77bcf86cd799439011',
        quantity: 1
      });

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']).toBeTruthy();
    expect(response.headers['set-cookie'].join(';')).toContain('cart_token=');
    expect(response.body.success).toBe(true);
  });
});
