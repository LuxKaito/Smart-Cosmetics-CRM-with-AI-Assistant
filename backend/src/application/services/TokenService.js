const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');

class TokenService {
  signAccessToken(user) {
    return jwt.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        email: user.email
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  }

  signRefreshToken(user) {
    return jwt.sign(
      {
        sub: user._id.toString(),
        tokenVersion: Date.now()
      },
      env.jwtRefreshSecret,
      { expiresIn: env.jwtRefreshExpiresIn }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, env.jwtRefreshSecret);
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = TokenService;
