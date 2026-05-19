const AuthService = require('../../src/application/services/AuthService');

describe('AuthService', () => {
  it('registers a user and publishes verification email event without issuing tokens', async () => {
    const createdUser = {
      _id: { toString: () => 'user-1' },
      email: 'new@example.com',
      role: 'user',
      createdAt: new Date(),
      toSafeObject: () => ({ _id: 'user-1', email: 'new@example.com', role: 'user' })
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
      expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed-password', role: 'user' })
    );
    expect(eventPublisher.publishUserRegistered).toHaveBeenCalled();
    expect(result.message).toBeTruthy();
  });
});
