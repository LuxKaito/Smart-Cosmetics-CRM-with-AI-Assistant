const { success } = require('../../shared/utils/apiResponse');

class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  dashboard = async (req, res) => {
    const data = await this.adminService.dashboard(Number(req.query.year || new Date().getFullYear()));
    return success(res, data);
  };

  listUsers = async (req, res) => {
    const data = await this.adminService.listUsers(req.query);
    return success(res, data);
  };

  setUserBlocked = async (req, res) => {
    const user = await this.adminService.setUserBlocked(req.params.id, req.body.isBlocked);
    return success(res, { user }, req.body.isBlocked ? 'User blocked' : 'User unblocked');
  };

  assignRole = async (req, res) => {
    const user = await this.adminService.assignRole(req.params.id, req.body.role);
    return success(res, { user }, 'Role assigned');
  };

  assignPermissions = async (req, res) => {
    const user = await this.adminService.assignPermissions(req.params.id, req.body.permissions);
    return success(res, { user }, 'Permissions assigned');
  };
}

module.exports = AdminController;
