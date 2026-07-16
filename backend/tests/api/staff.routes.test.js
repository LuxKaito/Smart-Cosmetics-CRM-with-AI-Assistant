const request = require('supertest');
const createApp = require('../../src/app');

const buildContainer = ({ role = 'staff' } = {}) => ({
  tokenService: {
    verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-1' })
  },
  userRepository: {
    findById: jest.fn().mockResolvedValue({
      _id: 'user-1',
      role,
      isBlocked: false,
      permissions: []
    })
  },
  authController: {},
  productController: {},
  cartController: {},
  adminController: {},
  staffController: {
    overview: jest.fn((req, res) => res.json({ success: true, data: { orders: {}, customers: {} } })),
    listOrders: jest.fn((req, res) => res.json({ success: true, data: { items: [] } })),
    getOrderDetail: jest.fn(),
    updateOrderStatus: jest.fn(),
    confirmOrder: jest.fn(),
    cancelOrder: jest.fn(),
    listCustomers: jest.fn((req, res) => res.json({ success: true, data: { items: [] } })),
    getCustomerDetail: jest.fn(),
    getCustomerOrders: jest.fn()
  },
  checkoutController: {},
  orderController: {},
  paymentController: {}
});

describe('Staff route protection', () => {
  it('allows staff to use staff order endpoints', async () => {
    const app = createApp(buildContainer());

    const response = await request(app)
      .get('/api/v1/staff/orders')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('rejects admins from staff endpoints', async () => {
    const app = createApp(buildContainer({ role: 'admin' }));

    const response = await request(app)
      .get('/api/v1/staff/customers')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('does not expose the removed admin order endpoint', async () => {
    const app = createApp(buildContainer({ role: 'admin' }));

    const response = await request(app)
      .get('/api/v1/admin/orders')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('does not expose the removed admin customer endpoint', async () => {
    const app = createApp(buildContainer({ role: 'admin' }));

    const response = await request(app)
      .get('/api/v1/admin/customers')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
