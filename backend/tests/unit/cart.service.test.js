const CartService = require('../../src/application/services/CartService');

describe('CartService', () => {
  it('adds a product to an existing cart and snapshots price', async () => {
    const cart = {
      items: [],
      save: jest.fn().mockResolvedValue(true)
    };
    const populatedCart = {
      userId: 'user-1',
      items: [{ productId: { _id: 'product-1', name: 'Cleanser' }, quantity: 2, priceSnapshot: 120000 }]
    };

    const cartRepository = {
      findRawByOwner: jest.fn().mockResolvedValue(cart),
      createForOwner: jest.fn(),
      save: jest.fn((value) => value.save()),
      findByOwner: jest.fn().mockResolvedValue(populatedCart)
    };
    const productRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: 'product-1',
        price: 120000,
        stock: 10,
        isActive: true,
        name: 'Cleanser',
        images: ['https://cdn.test/cleanser.jpg']
      })
    };

    const service = new CartService({ cartRepository, productRepository });
    const result = await service.addItem({ userId: 'user-1' }, 'product-1', 2);

    expect(cart.items).toEqual([
      {
        productId: 'product-1',
        quantity: 2,
        priceSnapshot: 120000,
        productNameSnapshot: 'Cleanser',
        imageSnapshot: 'https://cdn.test/cleanser.jpg'
      }
    ]);
    expect(cartRepository.save).toHaveBeenCalledWith(cart);
    expect(result).toBe(populatedCart);
  });
});
