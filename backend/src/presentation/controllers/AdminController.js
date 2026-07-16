const { success } = require('../../shared/utils/apiResponse');

class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  listProducts = async (req, res) => {
    const data = await this.adminService.listProducts(req.query);
    return success(res, data);
  };

  overview = async (req, res) => {
    const data = await this.adminService.overview(req.query);
    return success(res, data);
  };

  createProduct = async (req, res) => {
    const product = await this.adminService.createProduct(req.body);
    return success(res, { product }, 'Product created', 201);
  };

  updateProduct = async (req, res) => {
    const product = await this.adminService.updateProduct(req.params.id, req.body);
    return success(res, { product }, 'Product updated');
  };

  deleteProduct = async (req, res) => {
    const result = await this.adminService.deleteProduct(req.params.id);
    return success(res, result, 'Product hidden');
  };

  listUsers = async (req, res) => {
    const data = await this.adminService.listUsers(req.query);
    return success(res, data);
  };

  createUser = async (req, res) => {
    const user = await this.adminService.createUser(req.body);
    return success(res, { user }, 'User created', 201);
  };

  updateUser = async (req, res) => {
    const user = await this.adminService.updateUser(req.params.id, req.body, req.user);
    return success(res, { user }, 'User updated');
  };

  setUserBlocked = async (req, res) => {
    const user = await this.adminService.setUserBlocked(req.params.id, req.body.isBlocked, req.user);
    return success(res, { user }, req.body.isBlocked ? 'User blocked' : 'User unblocked');
  };

  assignRole = async (req, res) => {
    const user = await this.adminService.assignRole(req.params.id, req.body.role);
    return success(res, { user }, 'Role assigned');
  };

  listVouchers = async (req, res) => {
    const data = await this.adminService.listVouchers(req.query);
    return success(res, data);
  };

  createVoucher = async (req, res) => {
    const voucher = await this.adminService.createVoucher(req.body);
    return success(res, { voucher }, 'Voucher created', 201);
  };

  updateVoucher = async (req, res) => {
    const voucher = await this.adminService.updateVoucher(req.params.id, req.body);
    return success(res, { voucher }, 'Voucher updated');
  };

  deleteVoucher = async (req, res) => {
    const result = await this.adminService.deleteVoucher(req.params.id);
    return success(res, result, 'Voucher disabled');
  };

  statistics = async (req, res) => {
    const data = await this.adminService.statistics(req.query.year);
    return success(res, data);
  };
}

module.exports = AdminController;
