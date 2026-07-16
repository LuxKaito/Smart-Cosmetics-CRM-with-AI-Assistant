const { fail } = require('../../shared/utils/apiResponse');
const logger = require('../../shared/utils/logger');

const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
  USER_BLOCKED: 'Tài khoản đã bị khóa.',
  INVALID_TOKEN: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  INVALID_REFRESH_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  REFRESH_TOKEN_REQUIRED: 'Thiếu mã làm mới phiên đăng nhập.',
  EMAIL_EXISTS: 'Email đã được đăng ký.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_NOT_VERIFIED: 'Vui lòng xác thực email trước khi đăng nhập.',
  INVALID_EMAIL_VERIFICATION_TOKEN: 'Token xác thực không hợp lệ.',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'Token xác thực đã hết hạn.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản.',
  PASSWORD_NOT_CONFIGURED: 'Tài khoản này chưa thiết lập đăng nhập bằng mật khẩu.',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng.',
  SHIPPING_ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ giao hàng.',
  PRODUCT_NOT_FOUND: 'Không tìm thấy sản phẩm.',
  CART_EMPTY: 'Giỏ hàng đang trống.',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng.',
  VOUCHER_NOT_FOUND: 'Không tìm thấy voucher.',
  VOUCHER_NOT_SAVED: 'Voucher chưa được lưu trong tài khoản của bạn.',
  INVALID_VOUCHER_DISCOUNT: 'Phần trăm giảm giá không được vượt quá 100.',
  INVALID_VOUCHER_DATE_RANGE: 'Ngày kết thúc voucher phải lớn hơn hoặc bằng ngày bắt đầu.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  INSUFFICIENT_STOCK: 'Sản phẩm không đủ tồn kho.',
  QUANTITY_EXCEEDS_STOCK: 'Số lượng vượt quá tồn kho hiện có.',
  CART_NOT_FOUND: 'Không tìm thấy giỏ hàng.',
  CART_ITEM_NOT_FOUND: 'Không tìm thấy sản phẩm trong giỏ hàng.',
  CART_OWNER_REQUIRED: 'Không xác định được giỏ hàng.',
  INVALID_CART_TOKEN: 'Mã giỏ hàng không hợp lệ.',
  PRODUCT_INACTIVE: 'Một hoặc nhiều sản phẩm không còn bán.',
  ORDER_CANNOT_BE_CANCELLED: 'Đơn hàng không thể hủy.',
  ORDER_STATUS_LOCKED: 'Không thể thay đổi đơn hàng đã hoàn thành hoặc đã hủy.',
  INVALID_ORDER_STATUS_TRANSITION: 'Trạng thái đơn hàng mới không hợp lệ.',
  ORDER_NOT_PAYOS: 'Đơn hàng chưa được cấu hình thanh toán payOS.',
  ORDER_ALREADY_PAID: 'Đơn hàng đã được thanh toán.',
  UNSUPPORTED_PAYMENT_METHOD: 'Phương thức thanh toán không được hỗ trợ.',
  CUSTOMER_NOT_FOUND: 'Không tìm thấy khách hàng.',
  CUSTOMER_REQUIRED: 'Chỉ tài khoản khách hàng mới được thực hiện thao tác này.',
  INVALID_CUSTOMER_TARGET: 'Chỉ có thể thao tác với tài khoản khách hàng.',
  INVALID_FILE_TYPE: 'Chỉ cho phép tải lên tệp hình ảnh.',
  VOUCHER_CODE_REQUIRED: 'Vui lòng nhập mã voucher.',
  GOOGLE_OAUTH_NOT_CONFIGURED: 'Đăng nhập Google chưa được cấu hình.',
  GOOGLE_EMAIL_NOT_VERIFIED: 'Email Google chưa được xác thực.',
  PAYOS_INVALID_SIGNATURE: 'Chữ ký webhook payOS không hợp lệ.',
  PAYOS_ORDER_CODE_REQUIRED: 'Thiếu mã đơn hàng payOS.',
  PAYOS_ORDER_CODE_INVALID: 'Mã đơn hàng payOS không hợp lệ.',
  PAYOS_AMOUNT_INVALID: 'Số tiền thanh toán payOS không hợp lệ.',
  PAYOS_DESCRIPTION_INVALID: 'Nội dung thanh toán payOS không hợp lệ.',
  PAYOS_CREATE_LINK_FAILED: 'Không thể tạo liên kết thanh toán payOS.',
  SELF_BLOCK_DENIED: 'Bạn không thể tự khóa tài khoản của mình.',
  ADMIN_BLOCK_DENIED: 'Không thể khóa tài khoản quản trị từ chức năng này.',
  ADMIN_UPDATE_DENIED: 'Không thể cập nhật tài khoản quản trị từ chức năng này.',
  VALIDATION_ERROR: 'Dữ liệu gửi lên không hợp lệ.'
};

const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy đường dẫn: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500
      ? 'Đã xảy ra lỗi hệ thống.'
      : ERROR_MESSAGES[err.code] || err.message;

  logger.error(message, {
    statusCode,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    details: err.details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  return fail(res, message, statusCode, {
    code: err.code || 'INTERNAL_ERROR',
    details: err.details || null
  });
};

module.exports = { notFound, errorHandler };
