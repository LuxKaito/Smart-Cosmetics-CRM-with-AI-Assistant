const mongoose = require('mongoose');
const env = require('../config/env');
const PasswordService = require('../application/services/PasswordService');
const User = require('../infrastructure/database/models/UserModel');
const Product = require('../infrastructure/database/models/ProductModel');
const Order = require('../infrastructure/database/models/OrderModel');
const Voucher = require('../infrastructure/database/models/VoucherModel');
const ROLES = require('../shared/constants/roles');
const { PAYMENT_METHODS, PAYMENT_STATUSES, ORDER_STATUSES } = require('../shared/constants/order');
const { generateSeedOrderCode } = require('../shared/utils/orderCode');

const SAMPLE_TAG = '[ADMIN_SEED]';
const LOW_STOCK_TARGETS = [5, 7, 8, 9, 12];
const HEALTHY_STOCK_FLOOR = 24;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
}

const users = [
  {
    email: 'admin@luxberry.vn',
    password: 'Admin@123',
    name: 'LuxBerry Admin',
    phone: '0987654321',
    department: 'sales',
    role: ROLES.ADMIN,
    permissions: []
  },
  {
    email: 'staff.ops@luxberry.vn',
    password: 'Staff@123',
    name: 'Nguyen Thi Mai',
    phone: '0901234567',
    department: 'warehouse',
    role: ROLES.STAFF,
    permissions: []
  },
  {
    email: 'staff.cs@luxberry.vn',
    password: 'Staff@123',
    name: 'Pham Hong Anh',
    phone: '0902345678',
    department: 'support',
    role: ROLES.STAFF,
    permissions: []
  },
  ...Array.from({ length: 12 }, (_, index) => ({
    email: `customer${index + 1}@luxberry.vn`,
    password: 'Customer@123',
    name: `LuxBerry Customer ${index + 1}`,
    phone: `09${String(81000000 + index).slice(-8)}`,
    role: ROLES.CUSTOMER,
    permissions: [],
    createdOffset: index < 5 ? -index : -(8 + index),
    lastLoginOffset: index < 8 ? -(index % 6) : null
  }))
];

const voucherSeeds = [
  ['WELCOME10', 'Giam 10% don dau', 'percent', 10, 200000, 50000, 400, 86, true, -20, 45],
  ['BEAUTY50K', 'Giam 50K don lon', 'fixed', 50000, 500000, null, 180, 164, true, -15, 30],
  ['SUMMER15', 'He rang ro 15%', 'percent', 15, 300000, 100000, 250, 73, true, -10, 60],
  ['VIP20', 'Uu dai VIP 20%', 'percent', 20, 400000, 150000, 200, 188, false, -90, -10],
  ['SKINCARE99', 'Giam 99K skincare', 'fixed', 99000, 900000, null, 150, 72, true, -5, 90],
  ['LUXNEW', 'Khach moi LuxBerry', 'percent', 12, 250000, 60000, 260, 41, true, -2, 25],
  ['FLASH25', 'Flash sale 25%', 'percent', 25, 450000, 160000, 90, 88, true, -1, 5],
  ['FREESHIP20K', 'Ho tro phi ship', 'fixed', 20000, 150000, null, 300, 120, true, -30, 40],
  ['8MARCH', 'Ngay dep cua ban', 'percent', 30, 300000, 200000, 120, 98, false, -120, -50],
  ['LASTCALL', 'Uu dai sap het luot', 'percent', 18, 350000, 120000, 100, 94, true, -3, 10]
].map(([code, name, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, usedCount, isActive, startOffset, endOffset]) => {
  const now = new Date();
  const startDate = addDays(now, startOffset);
  const endDate = addDays(now, endOffset);
  return {
    code,
    name,
    description: `${name} cho khach hang LuxBerry Beauty.`,
    discountType,
    discountValue,
    minOrderValue,
    maxDiscount,
    usageLimit,
    usedCount,
    isActive,
    startDate,
    endDate
  };
});

const orderScenarios = [
  { daysAgo: 0, hour: 10, minute: 8, status: ORDER_STATUSES.DELIVERED, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 2, extra: true, discountRate: 0.08 },
  { daysAgo: 0, hour: 13, minute: 35, status: ORDER_STATUSES.SHIPPING, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: false },
  { daysAgo: 0, hour: 16, minute: 20, status: ORDER_STATUSES.CONFIRMED, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 2, extra: true, discountRate: 0.05 },
  { daysAgo: 1, hour: 9, minute: 15, status: ORDER_STATUSES.PENDING_CONFIRMATION, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: false },
  { daysAgo: 1, hour: 11, minute: 42, status: ORDER_STATUSES.SHIPPING, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 2, extra: true },
  { daysAgo: 1, hour: 15, minute: 5, status: ORDER_STATUSES.DELIVERED, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: true, discountRate: 0.1 },
  { daysAgo: 2, hour: 10, minute: 30, status: ORDER_STATUSES.CONFIRMED, paymentMethod: PAYMENT_METHODS.COD, quantity: 2, extra: false },
  { daysAgo: 2, hour: 13, minute: 18, status: ORDER_STATUSES.SHIPPING, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 1, extra: true },
  { daysAgo: 2, hour: 18, minute: 25, status: ORDER_STATUSES.PENDING_CONFIRMATION, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 1, extra: false, discountRate: 0.05 },
  { daysAgo: 3, hour: 8, minute: 50, status: ORDER_STATUSES.DELIVERED, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 2, extra: true },
  { daysAgo: 3, hour: 12, minute: 40, status: ORDER_STATUSES.CONFIRMED, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: true },
  { daysAgo: 3, hour: 17, minute: 12, status: ORDER_STATUSES.CANCELLED, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: false },
  { daysAgo: 4, hour: 9, minute: 22, status: ORDER_STATUSES.PENDING_CONFIRMATION, paymentMethod: PAYMENT_METHODS.COD, quantity: 2, extra: false },
  { daysAgo: 4, hour: 13, minute: 45, status: ORDER_STATUSES.SHIPPING, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 1, extra: true, discountRate: 0.08 },
  { daysAgo: 4, hour: 19, minute: 5, status: ORDER_STATUSES.CONFIRMED, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 2, extra: false },
  { daysAgo: 5, hour: 10, minute: 10, status: ORDER_STATUSES.DELIVERED, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: true },
  { daysAgo: 5, hour: 14, minute: 32, status: ORDER_STATUSES.PENDING_CONFIRMATION, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 1, extra: false, discountRate: 0.05 },
  { daysAgo: 5, hour: 16, minute: 58, status: ORDER_STATUSES.SHIPPING, paymentMethod: PAYMENT_METHODS.COD, quantity: 2, extra: true },
  { daysAgo: 6, hour: 11, minute: 8, status: ORDER_STATUSES.PENDING_CONFIRMATION, paymentMethod: PAYMENT_METHODS.COD, quantity: 1, extra: true },
  { daysAgo: 6, hour: 18, minute: 18, status: ORDER_STATUSES.CANCELLED, paymentMethod: PAYMENT_METHODS.PAYOS, quantity: 1, extra: false }
];

const run = async () => {
  await mongoose.connect(env.mongoUri);
  const passwordService = new PasswordService();
  const seededUsers = [];

  for (const seed of users) {
    const passwordHash = await passwordService.hash(seed.password);
    const createdAt = addDays(new Date(), seed.createdOffset || 0);
    const lastLoginAt = seed.lastLoginOffset === null || seed.lastLoginOffset === undefined ? null : addDays(new Date(), seed.lastLoginOffset);
    const user = await User.findOneAndUpdate(
      { email: seed.email },
      {
        $set: {
          name: seed.name,
          phone: seed.phone,
          department: seed.department || '',
          role: seed.role,
          permissions: seed.permissions,
          isBlocked: false,
          emailVerified: true,
          passwordHash,
          lastLoginAt,
          createdAt,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, timestamps: false }
    );
    seededUsers.push(user);
  }

  for (const voucher of voucherSeeds) {
    await Voucher.findOneAndUpdate(
      { code: voucher.code },
      { $set: voucher },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const products = await Product.find({ isActive: true }).sort({ soldCount: -1, createdAt: -1 }).limit(12);
  if (products.length) {
    const customers = seededUsers.filter((user) => user.role === ROLES.CUSTOMER);
    for (let index = 0; index < 20; index += 1) {
      const scenario = orderScenarios[index % orderScenarios.length];
      const customer = customers[index % customers.length];
      const firstProduct = products[index % products.length];
      const secondProduct = products[(index + 3) % products.length];
      const status = scenario.status;
      const paymentMethod = scenario.paymentMethod;
      const paymentStatus = resolvePaymentStatus(status, paymentMethod);
      const items = [buildOrderItem(firstProduct, scenario.quantity || 1)];
      if (scenario.extra) items.push(buildOrderItem(secondProduct, 1));
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const discount = scenario.discountRate ? Math.round(subtotal * scenario.discountRate) : 0;
      const shippingFee = subtotal > 500000 ? 0 : 25000;
      const totalAmount = Math.max(subtotal - discount + shippingFee, 0);
      const createdAt = withTime(addDays(new Date(), -scenario.daysAgo), scenario.hour, scenario.minute);

      await Order.findOneAndUpdate(
        { note: `${SAMPLE_TAG} ORDER-${String(index + 1).padStart(2, '0')}` },
        {
          $set: {
            user: customer._id,
            orderCode: generateSeedOrderCode(createdAt, index + 1, 'A'),
            items,
            shippingAddress: {
              fullName: customer.name,
              phone: customer.phone,
              province: 'Ho Chi Minh',
              district: 'Quan 1',
              ward: 'Ben Nghe',
              addressLine: `${20 + index} Nguyen Hue`
            },
            note: `${SAMPLE_TAG} ORDER-${String(index + 1).padStart(2, '0')}`,
            voucherCode: discount ? voucherSeeds[index % voucherSeeds.length].code : '',
            subtotal,
            discount,
            shippingFee,
            totalAmount,
            paymentMethod,
            paymentStatus,
            orderStatus: status,
            paidAt: paymentStatus === PAYMENT_STATUSES.PAID ? createdAt : null,
            cancelledAt: status === ORDER_STATUSES.CANCELLED ? createdAt : null,
            createdAt,
            updatedAt: createdAt
          }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true, timestamps: false }
      );
    }
  }

  const productSync = products.length ? await syncSeededProductMetrics(products) : null;

  console.log('[seed:admin] done');
  console.log('admin    admin@luxberry.vn / Admin@123');
  console.log('staff    staff.ops@luxberry.vn / Staff@123');
  console.log('customer customer1@luxberry.vn / Customer@123');
  console.log(`users    ${users.length}`);
  console.log(`vouchers ${voucherSeeds.length}`);
  console.log(products.length ? 'orders   20' : 'orders   skipped because no products exist');
  if (productSync) {
    console.log(`products synced ${productSync.synced}`);
    console.log(`low stock demo ${productSync.lowStock}`);
  }
  await mongoose.disconnect();
};

const buildOrderItem = (product, quantity) => {
  const price = Number(product.sale_price || 0);
  return {
    productId: product._id,
    productNameSnapshot: product.name || product.product_name_vn || 'Product',
    imageSnapshot: product.image_url || product.images?.[0] || '',
    quantity,
    priceSnapshot: price,
    lineTotal: price * quantity
  };
};

function withTime(date, hour = 10, minute = 0) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function resolvePaymentStatus(status, paymentMethod) {
  if (status === ORDER_STATUSES.CANCELLED) return PAYMENT_STATUSES.CANCELLED;
  if (paymentMethod === PAYMENT_METHODS.PAYOS) return PAYMENT_STATUSES.PAID;
  if ([ORDER_STATUSES.SHIPPING, ORDER_STATUSES.DELIVERED].includes(status)) return PAYMENT_STATUSES.PAID;
  return PAYMENT_STATUSES.UNPAID;
}

async function syncSeededProductMetrics(products) {
  const seededOrderMatch = {
    note: { $regex: `^${escapeRegExp(SAMPLE_TAG)}` },
    $or: [
      { paymentStatus: PAYMENT_STATUSES.PAID },
      { orderStatus: { $in: [ORDER_STATUSES.SHIPPING, ORDER_STATUSES.DELIVERED] } }
    ]
  };

  const soldRows = await Order.aggregate([
    { $match: seededOrderMatch },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        soldCount: { $sum: '$items.quantity' }
      }
    },
    { $sort: { soldCount: -1 } }
  ]);

  const soldByProduct = new Map(soldRows.map((row) => [String(row._id), Number(row.soldCount || 0)]));
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const rankedProducts = [
    ...soldRows.map((row) => productById.get(String(row._id))).filter(Boolean),
    ...products.filter((product) => !soldByProduct.has(String(product._id)))
  ];

  let lowStock = 0;
  for (const [index, product] of rankedProducts.entries()) {
    const productId = String(product._id);
    const soldCount = soldByProduct.get(productId) || 0;
    const shouldUseLowStock = soldCount > 0 && index < LOW_STOCK_TARGETS.length;
    const stock = shouldUseLowStock
      ? LOW_STOCK_TARGETS[index]
      : Math.max(HEALTHY_STOCK_FLOOR + index, Number(product.stock || 0) - soldCount);

    if (shouldUseLowStock) lowStock += 1;
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          soldCount,
          stock
        }
      },
      { runValidators: true }
    );
  }

  return {
    synced: rankedProducts.length,
    lowStock
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

run().catch(async (error) => {
  console.error('[seed:admin] failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
