const MongoUserRepository = require('../infrastructure/database/repositories/MongoUserRepository');
const MongoProductRepository = require('../infrastructure/database/repositories/MongoProductRepository');
const MongoCartRepository = require('../infrastructure/database/repositories/MongoCartRepository');
const MongoOrderRepository = require('../infrastructure/database/repositories/MongoOrderRepository');
const RabbitMQClient = require('../infrastructure/messaging/RabbitMQClient');
const EventPublisher = require('../infrastructure/messaging/EventPublisher');
const GoogleOAuthClient = require('../infrastructure/oauth/GoogleOAuthClient');
const GoogleMapsClient = require('../infrastructure/maps/GoogleMapsClient');
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
const AddressLookupService = require('../application/services/AddressLookupService');
const AuthController = require('../presentation/controllers/AuthController');
const ProductController = require('../presentation/controllers/ProductController');
const CartController = require('../presentation/controllers/CartController');
const AdminController = require('../presentation/controllers/AdminController');
const CheckoutController = require('../presentation/controllers/CheckoutController');
const OrderController = require('../presentation/controllers/OrderController');
const PaymentController = require('../presentation/controllers/PaymentController');

const buildContainer = () => {
  const userRepository = new MongoUserRepository();
  const productRepository = new MongoProductRepository();
  const cartRepository = new MongoCartRepository();
  const orderRepository = new MongoOrderRepository();

  const rabbitMqClient = new RabbitMQClient();
  const eventPublisher = new EventPublisher(rabbitMqClient);
  const passwordService = new PasswordService();
  const tokenService = new TokenService();
  const googleOAuthClient = new GoogleOAuthClient();
  const googleMapsClient = new GoogleMapsClient();
  const payosClient = new PayOSClient();
  const cartService = new CartService({ cartRepository, productRepository, eventPublisher });
  const checkoutService = new CheckoutService({ cartRepository, productRepository });
  const orderService = new OrderService({
    orderRepository,
    checkoutService,
    cartRepository,
    productRepository,
    payosClient,
    eventPublisher
  });
  const paymentService = new PaymentService({ orderService, payosClient });
  const addressLookupService = new AddressLookupService({ googleMapsClient });

  const authService = new AuthService({
    userRepository,
    passwordService,
    tokenService,
    googleOAuthClient,
    eventPublisher,
    cartService
  });
  const productService = new ProductService({ productRepository, eventPublisher });
  const adminService = new AdminService({ userRepository, productRepository, orderRepository });

  return {
    userRepository,
    productRepository,
    cartRepository,
    orderRepository,
    rabbitMqClient,
    eventPublisher,
    passwordService,
    tokenService,
    googleOAuthClient,
    googleMapsClient,
    payosClient,
    authService,
    productService,
    cartService,
    checkoutService,
    orderService,
    paymentService,
    addressLookupService,
    adminService,
    authController: new AuthController(authService),
    productController: new ProductController(productService),
    cartController: new CartController(cartService),
    adminController: new AdminController(adminService),
    checkoutController: new CheckoutController(checkoutService, addressLookupService),
    orderController: new OrderController(orderService),
    paymentController: new PaymentController(paymentService)
  };
};

module.exports = buildContainer;
