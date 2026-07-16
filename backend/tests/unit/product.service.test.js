const ProductService = require('../../src/application/services/ProductService');

describe('ProductService shared Mongo schema', () => {
  it('stores canonical category fields and removes legacy aliases', async () => {
    const productRepository = {
      create: jest.fn(async (payload) => ({ _id: 'product-1', ...payload }))
    };
    const eventPublisher = {
      publishProductCreated: jest.fn().mockResolvedValue(undefined)
    };
    const service = new ProductService({ productRepository, eventPublisher });

    await service.create({
      name: 'Cleanser Demo',
      sale_price: 120000,
      category: 'Cham Soc Da Mat',
      subcategory: 'Lam Sach Da',
      product_type: 'Sua Rua Mat',
      ingredients: 'Ceramide',
      usageInstructions: 'Dung moi toi'
    });

    expect(productRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category_level_2: 'Cham Soc Da Mat',
        benefits: 'Lam Sach Da',
        product_type: 'Sua Rua Mat',
        ingredients: 'Ceramide',
        usage_instructions: 'Dung moi toi'
      })
    );
    const stored = productRepository.create.mock.calls[0][0];
    expect(stored).not.toHaveProperty('category');
    expect(stored).not.toHaveProperty('subcategory');
    expect(stored).not.toHaveProperty('categories');
    expect(stored).not.toHaveProperty('usageInstructions');
  });

  it('returns storefront aliases without changing canonical fields', async () => {
    const productRepository = {
      search: jest.fn().mockResolvedValue({
        items: [
          {
            _id: 'product-1',
            name: 'Cleanser Demo',
            sale_price: 120000,
            category_level_1: 'Suc Khoe - Lam Dep',
            category_level_2: 'Cham Soc Da Mat',
            benefits: 'Lam Sach Da',
            product_type: 'Sua Rua Mat',
            usage_instructions: 'Dung moi toi'
          }
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      })
    };
    const service = new ProductService({ productRepository, eventPublisher: {} });

    const result = await service.list({});

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        category: 'Cham Soc Da Mat',
        subcategory: 'Sua Rua Mat',
        categories: ['Suc Khoe - Lam Dep', 'Cham Soc Da Mat', 'Lam Sach Da', 'Sua Rua Mat'],
        usageInstructions: 'Dung moi toi'
      })
    );
  });

  it('keeps editable product descriptions when updating a product', async () => {
    const productRepository = {
      updateById: jest.fn(async (id, payload) => ({ _id: id, ...payload }))
    };
    const eventPublisher = {
      publishProductUpdated: jest.fn().mockResolvedValue(undefined)
    };
    const service = new ProductService({ productRepository, eventPublisher });

    const result = await service.update('product-1', {
      name: 'Serum demo',
      sale_price: 150000,
      shortDescription: 'Mô tả ngắn',
      detailDescription: 'Thông tin chi tiết'
    });

    expect(productRepository.updateById).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({
        shortDescription: 'Mô tả ngắn',
        detailDescription: 'Thông tin chi tiết'
      })
    );
    expect(result.shortDescription).toBe('Mô tả ngắn');
    expect(result.detailDescription).toBe('Thông tin chi tiết');
  });
});
