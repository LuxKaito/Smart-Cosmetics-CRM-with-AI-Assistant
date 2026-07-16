const MESSAGE_TRANSLATIONS = {
  Success: 'Thao tác thành công.',
  Error: 'Đã xảy ra lỗi.',
  'Login successfully': 'Đăng nhập thành công.',
  'Google login successfully': 'Đăng nhập bằng Google thành công.',
  'Token refreshed': 'Đã làm mới phiên đăng nhập.',
  'Logout successfully': 'Đăng xuất thành công.',
  'Password changed successfully': 'Đổi mật khẩu thành công.',
  'Profile updated successfully': 'Cập nhật thông tin cá nhân thành công.',
  'Shipping address added successfully': 'Thêm địa chỉ giao hàng thành công.',
  'Shipping address updated successfully': 'Cập nhật địa chỉ giao hàng thành công.',
  'Shipping address deleted successfully': 'Xóa địa chỉ giao hàng thành công.',
  'Cart item added': 'Đã thêm sản phẩm vào giỏ hàng.',
  'Cart item updated': 'Đã cập nhật giỏ hàng.',
  'Cart item removed': 'Đã xóa sản phẩm khỏi giỏ hàng.',
  'Cart cleared': 'Đã xóa toàn bộ giỏ hàng.',
  'Cart merged': 'Đã đồng bộ giỏ hàng.',
  'Product created': 'Tạo sản phẩm thành công.',
  'Product updated': 'Cập nhật sản phẩm thành công.',
  'Product hidden': 'Đã ẩn sản phẩm.',
  'Product deleted': 'Đã xóa sản phẩm.',
  'User created': 'Tạo tài khoản thành công.',
  'User updated': 'Cập nhật tài khoản thành công.',
  'User blocked': 'Đã khóa tài khoản.',
  'User unblocked': 'Đã mở khóa tài khoản.',
  'Role assigned': 'Phân quyền tài khoản thành công.',
  'Voucher created': 'Tạo voucher thành công.',
  'Voucher updated': 'Cập nhật voucher thành công.',
  'Voucher disabled': 'Đã vô hiệu hóa voucher.',
  'Voucher saved': 'Đã lưu voucher.',
  'Order created successfully': 'Tạo đơn hàng thành công.',
  'Order cancelled': 'Đã hủy đơn hàng.',
  'Order status updated': 'Cập nhật trạng thái đơn hàng thành công.',
  'Order confirmed': 'Đã xác nhận đơn hàng.',
  'payOS payment link created': 'Đã tạo liên kết thanh toán payOS.',
  'Webhook processed': 'Đã xử lý webhook.'
};

const localizeMessage = (message) => MESSAGE_TRANSLATIONS[message] || message;

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: localizeMessage(message),
    data
  });
};

const fail = (res, message = 'Error', statusCode = 500, data = {}) => {
  return res.status(statusCode).json({
    success: false,
    message: localizeMessage(message),
    data
  });
};

module.exports = { success, fail, localizeMessage };
