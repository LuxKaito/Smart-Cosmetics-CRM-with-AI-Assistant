const express = require('express');
const asyncHandler = require('../../shared/utils/asyncHandler');
const validate = require('../../shared/validators/validate');
const ROLES = require('../../shared/constants/roles');
const PERMISSIONS = require('../../shared/constants/permissions');
const {
  listUsersQuerySchema,
  assignRoleSchema,
  blockUserSchema,
  assignPermissionsSchema
} = require('../../application/dtos/adminDtos');
const { protectRoute, authorize } = require('../middlewares/authMiddleware');

const adminRoutes = ({ adminController, tokenService, userRepository }) => {
  const router = express.Router();
  router.use(protectRoute(tokenService, userRepository));

  router.get(
    '/dashboard',
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.DASHBOARD_VIEW] }),
    asyncHandler(adminController.dashboard)
  );
  router.get(
    '/users',
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.USER_LIST] }),
    validate(listUsersQuerySchema, 'query'),
    asyncHandler(adminController.listUsers)
  );
  router.patch(
    '/users/:id/block',
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.USER_BLOCK] }),
    validate(blockUserSchema),
    asyncHandler(adminController.setUserBlocked)
  );
  router.patch(
    '/users/:id/role',
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.USER_ASSIGN_ROLE] }),
    validate(assignRoleSchema),
    asyncHandler(adminController.assignRole)
  );
  router.patch(
    '/users/:id/permissions',
    authorize({ roles: [ROLES.ADMIN], permissions: [PERMISSIONS.USER_ASSIGN_PERMISSION] }),
    validate(assignPermissionsSchema),
    asyncHandler(adminController.assignPermissions)
  );

  return router;
};

module.exports = adminRoutes;
