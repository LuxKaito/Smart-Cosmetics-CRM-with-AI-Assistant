const basePermissions = {
  DASHBOARD_VIEW: 'dashboard:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  USER_LIST: 'user:list',
  USER_BLOCK: 'user:block',
  USER_ASSIGN_ROLE: 'user:assign-role',
  USER_ASSIGN_PERMISSION: 'user:assign-permission'
};

const PERMISSIONS = Object.freeze({
  ...basePermissions,
  ALL: Object.freeze(Object.values(basePermissions))
});

module.exports = PERMISSIONS;
