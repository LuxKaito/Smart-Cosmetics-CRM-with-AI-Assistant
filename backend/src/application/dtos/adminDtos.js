const Joi = require('joi');
const ROLES = require('../../shared/constants/roles');
const PERMISSIONS = require('../../shared/constants/permissions');

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  search: Joi.string().trim().optional()
});

const assignRoleSchema = Joi.object({
  role: Joi.string().valid(...Object.values(ROLES)).required()
});

const blockUserSchema = Joi.object({
  isBlocked: Joi.boolean().required()
});

const assignPermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid(...PERMISSIONS.ALL))
    .unique()
    .required()
});

module.exports = {
  listUsersQuerySchema,
  assignRoleSchema,
  blockUserSchema,
  assignPermissionsSchema
};
