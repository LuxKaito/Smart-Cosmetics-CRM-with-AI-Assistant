const MongoUserRepository = require('../infrastructure/database/repositories/MongoUserRepository');
const MongoProductRepository = require('../infrastructure/database/repositories/MongoProductRepository');
const MongoCartRepository = require('../infrastructure/database/repositories/MongoCartRepository');
const MongoOrderRepository = require('../infrastructure/database/repositories/MongoOrderRepository');
const MongoVoucherRepository = require('../infrastructure/database/repositories/MongoVoucherRepository');
const MongoReviewRepository = require('../infrastructure/database/repositories/MongoReviewRepository');
const RabbitMQClient = require('../infrastructure/messaging/RabbitMQClient');
const EventPublisher = require('../infrastructure/messaging/EventPublisher');
const GoogleOAuthClient = require('../infrastructure/oauth/GoogleOAuthClient');
const PayOSClient = require('../infrastructure/payments/PayOSClient');
const PasswordService = require('../application/services/PasswordService');
const TokenService = require('../application/services/TokenService');
const AuthService = require('../application/services/AuthService');
const ProductService = require('../application/services/ProductService');
const CartService = require('../application/services/CartService');
const CheckoutService = require('../application/services/CheckoutService');
const OrderService = require('../application/services/OrderService');
const PaymentService = require('../application/services/PaymentService');
const AdminService = require('../application/services/AdminService');
const StaffService = require('../application/services/StaffService');
const VoucherService = require('../application/services/VoucherService');
const ReviewService = require('../application/services/ReviewService');
const AuthController = require('../presentation/controllers/AuthController');
const ProductController = require('../presentation/controllers/ProductController');
const CartController = require('../presentation/controllers/CartController');
const AdminController = require('../presentation/controllers/AdminController');
const StaffController = require('../presentation/controllers/StaffController');
const CheckoutController = require('../presentation/controllers/CheckoutController');
const OrderController = require('../presentation/controllers/OrderController');
const PaymentController = require('../presentation/controllers/PaymentController');
const VoucherController = require('../presentation/controllers/VoucherController');
const ReviewController = require('../presentation/controllers/ReviewController');

const buildContainer = () => {
  const userRepository = new MongoUserRepository();
  const productRepository = new MongoProductRepository();
  const cartRepository = new MongoCartRepository();
  const orderRepository = new MongoOrderRepository();
  const voucherRepository = new MongoVoucherRepository();
  const reviewRepository = new MongoReviewRepository();

  const rabbitMqClient = new RabbitMQClient();
  const eventPublisher = new EventPublisher(rabbitMqClient);
  const passwordService = new PasswordService();
  const tokenService = new TokenService();
  const googleOAuthClient = new GoogleOAuthClient();
  const payosClient = new PayOSClient();
  const cartService = new CartService({ cartRepository, productRepository, eventPublisher });
  const checkoutService = new CheckoutService({ cartRepository, productRepository, voucherRepository, userRepository });
  const orderService = new OrderService({
    orderRepository,
    checkoutService,
    cartRepository,
    productRepository,
    voucherRepository,
    payosClient,
    eventPublisher
  });
  const paymentService = new PaymentService({ orderService, payosClient });

  const authService = new AuthService({
    userRepository,
    productRepository,
    passwordService,
    tokenService,
    googleOAuthClient,
    eventPublisher,
    cartService
  });
  const productService = new ProductService({ productRepository, eventPublisher });
  const adminService = new AdminService({
    userRepository,
    productRepository,
    orderRepository,
    voucherRepository,
    productService,
    passwordService
  });
  const voucherService = new VoucherService({ voucherRepository, userRepository });
  const staffService = new StaffService({ userRepository, orderRepository });
  const reviewService = new ReviewService({ reviewRepository, orderRepository, productRepository });

  return {
    userRepository,
    productRepository,
    cartRepository,
    orderRepository,
    voucherRepository,
    reviewRepository,
    rabbitMqClient,
    eventPublisher,
    passwordService,
    tokenService,
    googleOAuthClient,
    payosClient,
    authService,
    productService,
    cartService,
    checkoutService,
    orderService,
    paymentService,
    adminService,
    staffService,
    voucherService,
    reviewService,
    authController: new AuthController(authService),
    productController: new ProductController(productService),
    cartController: new CartController(cartService),
    adminController: new AdminController(adminService),
    staffController: new StaffController(staffService),
    checkoutController: new CheckoutController(checkoutService),
    orderController: new OrderController(orderService),
    paymentController: new PaymentController(paymentService),
    voucherController: new VoucherController(voucherService),
    reviewController: new ReviewController(reviewService)
  };
};

module.exports = buildContainer;
