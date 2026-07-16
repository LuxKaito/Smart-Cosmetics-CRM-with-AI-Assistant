const basePermissions = {
  STATISTICS_VIEW: 'statistics:view',
  PRODUCT_LIST: 'product:list',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  USER_LIST: 'user:list',
  USER_BLOCK: 'user:block',
  USER_ASSIGN_ROLE: 'user:assign-role',
  USER_ASSIGN_PERMISSION: 'user:assign-permission',
  CUSTOMER_LIST: 'customer:list',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_BLOCK: 'customer:block',
  ORDER_LIST: 'order:list',
  ORDER_UPDATE_STATUS: 'order:update-status',
  ORDER_CANCEL: 'order:cancel',
  VOUCHER_LIST: 'voucher:list',
  VOUCHER_CREATE: 'voucher:create',
  VOUCHER_UPDATE: 'voucher:update',
  VOUCHER_DELETE: 'voucher:delete'
};

const allPermissions = Object.freeze([...new Set(Object.values(basePermissions))]);
const staffAssignable = Object.freeze(
  [
    basePermissions.STATISTICS_VIEW,
    basePermissions.PRODUCT_LIST,
    basePermissions.PRODUCT_CREATE,
    basePermissions.PRODUCT_UPDATE,
    basePermissions.PRODUCT_DELETE,
    basePermissions.CUSTOMER_LIST,
    basePermissions.CUSTOMER_UPDATE,
    basePermissions.CUSTOMER_BLOCK,
    basePermissions.ORDER_LIST,
    basePermissions.ORDER_UPDATE_STATUS,
    basePermissions.ORDER_CANCEL,
    basePermissions.VOUCHER_LIST,
    basePermissions.VOUCHER_CREATE,
    basePermissions.VOUCHER_UPDATE,
    basePermissions.VOUCHER_DELETE
  ].filter((permission, index, arr) => arr.indexOf(permission) === index)
);

const PERMISSIONS = Object.freeze({
  ...basePermissions,
  ALL: allPermissions,
  STAFF_ASSIGNABLE: staffAssignable
});

module.exports = PERMISSIONS;
