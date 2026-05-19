const request = require('supertest');
const createApp = require('../../src/app');

describe('Auth routes', () => {
  it('validates register body', async () => {
    const app = createApp({
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
      },
      tokenService: { verifyAccessToken: jest.fn() },
      userRepository: { findById: jest.fn() }
    });

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'bad-email',
      password: 'short'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.data.code).toBe('VALIDATION_ERROR');
  });
});
