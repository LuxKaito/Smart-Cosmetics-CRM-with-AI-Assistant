const AppError = require('../../shared/errors/AppError');
const { PAYMENT_METHODS } = require('../../shared/constants/order');
const { buildShippingQuote } = require('../../shared/utils/shipping');
const {
  calculateVoucherDiscount,
  formatVoucher,
  getVoucherEligibility,
  normalizeVoucherCode,
  toPlainVoucher
} = require('../../shared/utils/voucher');

class CheckoutService {
  constructor({ cartRepository, productRepository, voucherRepository = null, userRepository = null }) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.voucherRepository = voucherRepository;
    this.userRepository = userRepository;
  }

  async getSummary(userId, options = {}) {
    const cart = await this.cartRepository.findByOwner({ userId });
    if (!cart || !cart.items?.length) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    const items = [];
    for (const cartItem of cart.items) {
      const product = await resolveProduct(cartItem.productId, this.productRepository);
      if (!product || product.isActive === false) {
        throw new AppError('One or more products are no longer available', 400, 'PRODUCT_INACTIVE');
      }
      if (product.stock < cartItem.quantity) {
        throw new AppError('One or more products are out of stock', 400, 'INSUFFICIENT_STOCK');
      }

      const unitPrice = getProductPrice(product);
      const originalUnitPrice = getProductOriginalPrice(product, unitPrice);
      const lineTotal = unitPrice * cartItem.quantity;
      const lineOriginalTotal = originalUnitPrice * cartItem.quantity;
      const lineDiscount = Math.max(0, lineOriginalTotal - lineTotal);

      items.push({
        productId: product._id.toString(),
        name: product.name || cartItem.productNameSnapshot || '',
        image: getProductImage(product) || cartItem.imageSnapshot || '',
        quantity: cartItem.quantity,
        unitPrice,
        originalUnitPrice,
        lineTotal,
        lineOriginalTotal,
        lineDiscount,
        priceSnapshot: cartItem.priceSnapshot,
        priceChanged: Number(cartItem.priceSnapshot) !== Number(unitPrice)
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineOriginalTotal, 0);
    const itemDiscount = items.reduce((sum, item) => sum + item.lineDiscount, 0);
    const merchandiseTotal = Math.max(0, subtotal - itemDiscount);
    const voucherContext = await this.resolveVoucherContext(userId, options?.voucherCode, merchandiseTotal);
    const voucherDiscount = voucherContext.voucher
      ? calculateVoucherDiscount(voucherContext.voucher, merchandiseTotal)
      : 0;
    const province = options?.shippingAddress?.province || options?.province || '';
    const shipping = buildShippingQuote({
      merchandiseTotal,
      province
    });
    const shippingFee = shipping.fee;
    const total = Math.max(0, merchandiseTotal + shippingFee - voucherDiscount);
    const discount = itemDiscount + voucherDiscount;

    return {
      cartId: cart._id.toString(),
      items,
      subtotal,
      discount,
      itemDiscount,
      voucherDiscount,
      voucher: voucherContext.voucher ? formatVoucher(voucherContext.voucher, { merchandiseTotal }) : null,
      availableVouchers: voucherContext.availableVouchers,
      shippingFee,
      total,
      shipping,
      availablePaymentMethods: [PAYMENT_METHODS.COD, PAYMENT_METHODS.PAYOS]
    };
  }

  async resolveVoucherContext(userId, voucherCode, merchandiseTotal) {
    if (!this.voucherRepository || !this.userRepository) {
      return {
        voucher: null,
        availableVouchers: []
      };
    }

    const savedCodes = await this.userRepository.getSavedVoucherCodes(userId);
    const vouchers = await this.voucherRepository.findByCodes(savedCodes);
    const voucherByCode = new Map(
      (vouchers || []).map((voucher) => [normalizeVoucherCode(toPlainVoucher(voucher)?.code), voucher])
    );
    const availableVouchers = savedCodes
      .map((code) => voucherByCode.get(normalizeVoucherCode(code)))
      .filter(Boolean)
      .map((voucher) => formatVoucher(voucher, { merchandiseTotal }));

    const normalizedCode = normalizeVoucherCode(voucherCode);
    if (!normalizedCode) {
      return {
        voucher: null,
        availableVouchers
      };
    }

    if (!savedCodes.map(normalizeVoucherCode).includes(normalizedCode)) {
      throw new AppError('Voucher chưa được lưu trong tài khoản của bạn.', 400, 'VOUCHER_NOT_SAVED');
    }

    const voucher = voucherByCode.get(normalizedCode);
    const eligibility = getVoucherEligibility(voucher, merchandiseTotal);
    if (!eligibility.eligible) {
      throw new AppError(eligibility.reason || 'Voucher chưa đủ điều kiện áp dụng.', 400, 'VOUCHER_NOT_ELIGIBLE', {
        missingAmount: eligibility.missingAmount
      });
    }

    return {
      voucher,
      availableVouchers
    };
  }
}

const resolveProduct = async (productRef, productRepository) => {
  if (!productRef) return null;
  if (productRef._id) return productRef;
  return productRepository.findById(productRef);
};

const getProductPrice = (product) => Number(product.sale_price ?? 0);
const getProductOriginalPrice = (product, fallbackPrice = 0) =>
  Math.max(Number(fallbackPrice || 0), Number(product.original_price ?? fallbackPrice ?? 0));

const getProductImage = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  return product.image_url || '';
};

module.exports = CheckoutService;
