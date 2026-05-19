const mongoose = require('mongoose');
const env = require('../config/env');
const PasswordService = require('../application/services/PasswordService');
const User = require('../infrastructure/database/models/UserModel');
const Product = require('../infrastructure/database/models/ProductModel');
const Cart = require('../infrastructure/database/models/CartModel');
const ROLES = require('../shared/constants/roles');
const PERMISSIONS = require('../shared/constants/permissions');

const run = async () => {
  await mongoose.connect(env.mongoUri);

  const passwordService = new PasswordService();
  const customerPasswordHash = await passwordService.hash('Customer@123');
  const staffPasswordHash = await passwordService.hash('Staff@123');

  const customer = await User.findOneAndUpdate(
    { email: 'customer1@example.com' },
    {
      $set: {
        name: 'Customer Demo',
        role: ROLES.USER,
        isBlocked: false,
        permissions: [],
        passwordHash: customerPasswordHash
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const staff = await User.findOneAndUpdate(
    { email: 'staff1@example.com' },
    {
      $set: {
        name: 'Staff Demo',
        role: ROLES.STAFF,
        isBlocked: false,
        permissions: [PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE],
        passwordHash: staffPasswordHash
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const product = await Product.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!product) {
    console.log('[seed:samples] No active product found. Please run npm run seed:products first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  await Cart.findOneAndUpdate(
    { user: customer._id },
    {
      $set: {
        user: customer._id,
        guestId: null,
        items: [
          {
            product: product._id,
            quantity: 2,
            priceSnapshot: product.price || product.sale_price || 0
          }
        ]
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Cart.findOneAndUpdate(
    { guestId: 'guest-demo-0001' },
    {
      $set: {
        user: null,
        guestId: 'guest-demo-0001',
        items: [
          {
            product: product._id,
            quantity: 1,
            priceSnapshot: product.price || product.sale_price || 0
          }
        ]
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('[seed:samples] Done');
  console.log('customer email: customer1@example.com | password: Customer@123');
  console.log('staff email: staff1@example.com | password: Staff@123');
  console.log('staff permissions:', [PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE].join(', '));
  console.log('guest id sample:', 'guest-demo-0001');
  console.log('sample product id:', product._id.toString());

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[seed:samples] failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
