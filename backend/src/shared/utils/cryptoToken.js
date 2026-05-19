const crypto = require('crypto');

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const hashSha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

module.exports = {
  generateSecureToken,
  hashSha256
};
