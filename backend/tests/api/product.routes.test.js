const request = require('supertest');
const createApp = require('../../src/app');

const makeContainer = () => {
  const adminUser = { _id: 'admin-1', email: 'admin@example.com', role: 'admin', isBlocked: false, permissions: [] };

  return {
    tokenService: {
      verifyAccessToken: jest.fn().mockReturnValue({ sub: 'admin-1' })
    },
    userRepository: {
      findById: jest.fn().mockResolvedValue(adminUser)
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
      list: jest.fn((req, res) =>
        res.json({ success: true, message: 'Success', data: { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } } })
      ),
      search: jest.fn((req, res) =>
        res.json({ success: true, message: 'Success', data: { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } } })
      ),
      listByCategory: jest.fn((req, res) =>
        res.json({ success: true, message: 'Success', data: { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } } })
      ),
      categories: jest.fn((req, res) =>
        res.json({ success: true, message: 'Success', data: { categories: [], subcategories: [], subcategoriesByCategory: {} } })
      ),
      detail: jest.fn((req, res) => res.json({ success: true, message: 'Success', data: { product: { _id: req.params.id } } })),
      create: jest.fn((req, res) => res.status(201).json({ success: true, message: 'Product created', data: { product: req.body } })),
      update: jest.fn((req, res) => res.json({ success: true, message: 'Product updated', data: { product: req.body } })),
      remove: jest.fn((req, res) => res.json({ success: true, message: 'Product deleted', data: { deleted: true } }))
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
    }
  };
};

describe('Product routes', () => {
  it('lists products with standard response format', async () => {
    const app = createApp(makeContainer());

    const response = await request(app).get('/api/v1/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Success',
        data: expect.any(Object)
      })
    );
  });

  it('allows admin product creation', async () => {
    const app = createApp(makeContainer());

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer valid-token')
      .send({
        name: 'Vitamin C Serum',
        sale_price: 250000,
        brand: 'Demo',
        product_type: 'Serum'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.product.name).toBe('Vitamin C Serum');
  });

  it('rejects staff product creation outside the staff sales API', async () => {
    const container = makeContainer();
    container.userRepository.findById.mockResolvedValue({
      _id: 'staff-1',
      email: 'staff@example.com',
      role: 'staff',
      isBlocked: false,
      permissions: ['product:create']
    });
    const app = createApp(container);

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', 'Bearer valid-token')
      .send({
        name: 'Vitamin C Serum',
        sale_price: 250000
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});
