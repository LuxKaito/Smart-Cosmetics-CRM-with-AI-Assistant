const AuthController = require('../../src/presentation/controllers/AuthController');
const env = require('../../src/config/env');

describe('AuthController', () => {
  it('clears auth and guest cart cookies on logout', async () => {
    const authService = {
      logout: jest.fn().mockResolvedValue({ loggedOut: true })
    };
    const controller = new AuthController(authService);
    const response = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await controller.logout({ user: { _id: 'user-1' } }, response);

    expect(authService.logout).toHaveBeenCalledWith('user-1');
    expect(response.clearCookie).toHaveBeenCalledWith(
      env.authAccessCookieName,
      expect.objectContaining({ path: '/' })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      env.authRefreshCookieName,
      expect.objectContaining({ path: '/' })
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      env.guestCartCookieName,
      expect.objectContaining({ path: '/' })
    );
  });
});
