const ProductService = require('../../src/application/services/ProductService');

describe('ProductService original price updates', () => {
  it('clears the original price when the admin removes it', async () => {
    const productRepository = {
      updateById: jest.fn(async (id, payload) => ({ _id: id, sale_price: 150000, ...payload }))
    };
    const eventPublisher = {
      publishProductUpdated: jest.fn().mockResolvedValue(undefined)
    };
    const service = new ProductService({ productRepository, eventPublisher });

    const result = await service.update('product-1', {
      sale_price: 150000,
      original_price: null
    });

    expect(productRepository.updateById).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({ original_price: null })
    );
    expect(result.original_price).toBeNull();
  });
});
