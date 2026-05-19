const AppError = require('../../shared/errors/AppError');
const ROLES = require('../../shared/constants/roles');

class AdminService {
  constructor({ userRepository, productRepository, orderRepository }) {
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
  }

  async dashboard(year) {
    const [totalUsers, totalProducts, totalOrders, revenue, topSellingProducts, monthly] = await Promise.all([
      this.userRepository.count(),
      this.productRepository.count(),
      this.orderRepository.count(),
      this.orderRepository.revenue(),
      this.productRepository.topSelling(10),
      this.orderRepository.monthlyRevenue(year)
    ]);

    const monthlyChart = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const found = monthly.find((item) => item._id.month === month);
      return {
        month,
        revenue: found?.revenue || 0,
        orders: found?.orders || 0
      };
    });

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      revenue,
      topSellingProducts,
      monthlyChart
    };
  }

  async listUsers(query) {
    return this.userRepository.list(query);
  }

  async setUserBlocked(userId, isBlocked) {
    const user = await this.userRepository.updateById(userId, { isBlocked });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  async assignRole(userId, role) {
    const payload = role === ROLES.STAFF ? { role } : { role, permissions: [] };
    const user = await this.userRepository.updateById(userId, payload);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  }

  async assignPermissions(userId, permissions) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    if (user.role !== ROLES.STAFF) {
      throw new AppError('Only staff accounts can receive granular API permissions', 400, 'INVALID_ROLE_FOR_PERMISSIONS');
    }

    const updated = await this.userRepository.updateById(userId, {
      permissions: [...new Set(permissions)]
    });
    if (!updated) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return updated;
  }
}

module.exports = AdminService;
