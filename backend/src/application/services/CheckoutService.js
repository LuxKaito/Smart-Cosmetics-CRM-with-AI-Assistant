const AppError = require('../../shared/errors/AppError');
const { PAYMENT_METHODS } = require('../../shared/constants/order');
const { buildShippingQuote } = require('../../shared/utils/shipping');

class CheckoutService {
  constructor({ cartRepository, productRepository }) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
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
    const discount = items.reduce((sum, item) => sum + item.lineDiscount, 0);
    const merchandiseTotal = Math.max(0, subtotal - discount);
    const province = options?.shippingAddress?.province || options?.province || '';
    const shipping = buildShippingQuote({
      merchandiseTotal,
      province
    });
    const shippingFee = shipping.fee;
    const total = merchandiseTotal + shippingFee;

    return {
      cartId: cart._id.toString(),
      items,
      subtotal,
      discount,
      shippingFee,
      total,
      shipping,
      availablePaymentMethods: [PAYMENT_METHODS.COD, PAYMENT_METHODS.PAYOS]
    };
  }
}

const resolveProduct = async (productRef, productRepository) => {
  if (!productRef) return null;
  if (productRef._id) return productRef;
  return productRepository.findById(productRef);
};

const getProductPrice = (product) => Number(product.sale_price ?? product.price ?? 0);
const getProductOriginalPrice = (product, fallbackPrice = 0) =>
  Math.max(Number(fallbackPrice || 0), Number(product.original_price ?? product.price ?? fallbackPrice ?? 0));

const getProductImage = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  return product.image_url || '';
};

module.exports = CheckoutService;
