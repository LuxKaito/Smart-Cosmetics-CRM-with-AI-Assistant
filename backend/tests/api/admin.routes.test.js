const request = require('supertest');
const createApp = require('../../src/app');

const buildContainer = ({ role = 'admin' } = {}) => ({
  tokenService: {
    verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-1' })
  },
  userRepository: {
    findById: jest.fn().mockResolvedValue({
      _id: 'user-1',
      role,
      isBlocked: false,
      permissions: [],
      toSafeObject() {
        return { _id: 'user-1', role };
      }
    })
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
    get: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    merge: jest.fn()
  },
  adminController: {
    listProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    listUsers: jest.fn(),
    setUserBlocked: jest.fn(),
    assignRole: jest.fn(),
    assignPermissions: jest.fn(),
    listVouchers: jest.fn(),
    createVoucher: jest.fn(),
    updateVoucher: jest.fn(),
    deleteVoucher: jest.fn(),
    statistics: jest.fn((req, res) =>
      res.json({
        success: true,
        message: 'Success',
        data: { totalOrders: 0 }
      })
    )
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

describe('Admin route protection', () => {
  it('rejects unauthenticated requests', async () => {
    const container = buildContainer();
    container.tokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid token');
    });

    const app = createApp(container);

    const response = await request(app).get('/api/v1/admin/statistics');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects authenticated non-admin requests', async () => {
    const app = createApp(buildContainer({ role: 'customer' }));

    const response = await request(app)
      .get('/api/v1/admin/statistics')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('allows admin requests', async () => {
    const app = createApp(buildContainer({ role: 'admin' }));

    const response = await request(app)
      .get('/api/v1/admin/statistics')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

