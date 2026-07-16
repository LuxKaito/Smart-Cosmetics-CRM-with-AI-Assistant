const AuthService = require('../../src/application/services/AuthService');

describe('AuthService', () => {
  it('registers a user and publishes verification email event without issuing tokens', async () => {
    const createdUser = {
      _id: { toString: () => 'user-1' },
      email: 'new@example.com',
      role: 'customer',
      createdAt: new Date(),
      toSafeObject: () => ({ _id: 'user-1', email: 'new@example.com', role: 'customer' })
    };

    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdUser)
    };
    const passwordService = { hash: jest.fn().mockResolvedValue('hashed-password') };
    const tokenService = {};
    const eventPublisher = { publishUserRegistered: jest.fn().mockResolvedValue(true) };

    const service = new AuthService({
      userRepository,
      passwordService,
      tokenService,
      googleOAuthClient: {},
      eventPublisher
    });

    const result = await service.register({
      email: 'new@example.com',
      password: 'Password123',
      name: 'New User'
    });

    expect(passwordService.hash).toHaveBeenCalledWith('Password123');
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed-password', role: 'customer' })
    );
    expect(eventPublisher.publishUserRegistered).toHaveBeenCalled();
    expect(result.message).toBeTruthy();
  });

  it('stores the first shipping address as the default address', async () => {
    const user = {
      _id: 'user-1',
      shippingAddresses: [],
      isBlocked: false
    };
    const updatedUser = {
      shippingAddresses: [{ _id: 'address-1', label: 'Nhà riêng', isDefault: true }],
      toSafeObject() {
        return { shippingAddresses: this.shippingAddresses };
      }
    };
    const userRepository = {
      findById: jest.fn().mockResolvedValue(user),
      updateById: jest.fn().mockResolvedValue(updatedUser)
    };
    const service = new AuthService({
      userRepository,
      passwordService: {},
      tokenService: {},
      googleOAuthClient: {},
      eventPublisher: {}
    });

    const result = await service.addShippingAddress('user-1', {
      label: 'Nhà riêng',
      fullName: 'Nguyen Van A',
      phone: '0901234567',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      addressLine: '1 Đồng Khởi',
      isDefault: false
    });

    expect(userRepository.updateById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        shippingAddresses: [
          expect.objectContaining({ label: 'Nhà riêng', isDefault: true })
        ]
      })
    );
    expect(result.addresses[0].isDefault).toBe(true);
  });

  it('saves a favorite product for an active user', async () => {
    const userRepository = {
      findById: jest.fn().mockResolvedValue({ _id: 'user-1', isBlocked: false }),
      addSavedProductId: jest.fn().mockResolvedValue({ savedProductIds: ['product-1'] })
    };
    const productRepository = {
      findById: jest.fn().mockResolvedValue({ _id: 'product-1', isActive: true })
    };
    const service = new AuthService({
      userRepository,
      productRepository,
      passwordService: {},
      tokenService: {},
      googleOAuthClient: {},
      eventPublisher: {}
    });

    const result = await service.saveFavoriteProduct('user-1', 'product-1');

    expect(userRepository.addSavedProductId).toHaveBeenCalledWith('user-1', 'product-1');
    expect(result.savedProductIds).toEqual(['product-1']);
  });
});
