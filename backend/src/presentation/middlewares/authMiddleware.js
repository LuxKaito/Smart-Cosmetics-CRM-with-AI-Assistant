const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');
const env = require('../../config/env');
const { parseCookies } = require('../../shared/utils/cookies');

const resolveAccessToken = (req) => {
  const authHeader = req.headers.authorization || '';
  const [, bearerToken] = authHeader.split(' ');
  if (bearerToken) return bearerToken;

  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[env.authAccessCookieName] || null;
};

const verifyJWT = (tokenService, userRepository) => async (req, res, next) => {
  const token = resolveAccessToken(req);

  if (!token) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));

  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user) return next(new AppError('User not found', 401, 'USER_NOT_FOUND'));
    if (user.isBlocked) return next(new AppError('User account is blocked', 403, 'USER_BLOCKED'));

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

const optionalAuth = (tokenService, userRepository) => async (req, res, next) => {
  const token = resolveAccessToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user) return next(new AppError('User not found', 401, 'USER_NOT_FOUND'));
    if (user.isBlocked) return next(new AppError('User account is blocked', 403, 'USER_BLOCKED'));

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
  }
};

const protectRoute = (tokenService, userRepository) => verifyJWT(tokenService, userRepository);

const requireAdmin = (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  if (req.user.role !== ROLES.ADMIN) return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  return next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
  if (!roles.includes(req.user.role)) return next(new AppError('Permission denied', 403, 'FORBIDDEN'));
  return next();
};

module.exports = {
  verifyJWT,
  optionalAuth,
  protectRoute,
  requireAdmin,
  requireRole
};
