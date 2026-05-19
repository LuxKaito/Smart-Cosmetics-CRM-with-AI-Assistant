const AppError = require('../../shared/errors/AppError');
const env = require('../../config/env');
const { hashSha256 } = require('../../shared/utils/cryptoToken');

class CartService {
  constructor({ cartRepository, productRepository, eventPublisher }) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
    this.eventPublisher = eventPublisher;
  }

  async getCart(owner) {
    const normalizedOwner = normalizeOwner(owner);
    let cart = await this.cartRepository.findByOwner(normalizedOwner);
    if (!cart) {
      await this.cartRepository.createForOwner(normalizedOwner, guestExpiryOptions(owner));
      cart = await this.cartRepository.findByOwner(normalizedOwner);
    }
    return cart;
  }

  async addItem(owner, productId, quantity) {
    const normalizedOwner = normalizeOwner(owner);
    const product = await this.productRepository.findById(productId);
    if (!product || product.isActive === false) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    if (product.stock < quantity) throw new AppError('Insufficient product stock', 400, 'INSUFFICIENT_STOCK');

    const cart =
      (await this.cartRepository.findRawByOwner(normalizedOwner)) ||
      (await this.cartRepository.createForOwner(normalizedOwner, guestExpiryOptions(owner)));
    const existingItem = cart.items.find((item) => item.productId.toString() === productId);

    if (existingItem) {
      const nextQuantity = existingItem.quantity + quantity;
      if (nextQuantity > product.stock) {
        throw new AppError('Quantity exceeds available stock', 400, 'QUANTITY_EXCEEDS_STOCK');
      }

      existingItem.quantity = nextQuantity;
      existingItem.priceSnapshot = getProductPrice(product);
      existingItem.productNameSnapshot = product.name || product.product_name_vn || '';
      existingItem.imageSnapshot = getProductImage(product);
    } else {
      cart.items.push({
        productId,
        quantity,
        priceSnapshot: getProductPrice(product),
        productNameSnapshot: product.name || product.product_name_vn || '',
        imageSnapshot: getProductImage(product)
      });
    }

    await this.cartRepository.save(cart);
    return this.cartRepository.findByOwner(normalizedOwner);
  }

  async updateItem(owner, productId, quantity) {
    const normalizedOwner = normalizeOwner(owner);
    const cart = await this.cartRepository.findRawByOwner(normalizedOwner);
    if (!cart) throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');

    const item = cart.items.find((cartItem) => cartItem.productId.toString() === productId);
    if (!item) throw new AppError('Product not found in cart', 404, 'CART_ITEM_NOT_FOUND');

    const product = await this.productRepository.findById(productId);
    if (!product || product.isActive === false) throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    if (quantity > product.stock) throw new AppError('Quantity exceeds available stock', 400, 'QUANTITY_EXCEEDS_STOCK');

    item.quantity = quantity;
    item.priceSnapshot = getProductPrice(product);
    item.productNameSnapshot = product.name || product.product_name_vn || '';
    item.imageSnapshot = getProductImage(product);

    await this.cartRepository.save(cart);
    return this.cartRepository.findByOwner(normalizedOwner);
  }

  async removeItem(owner, productId) {
    const normalizedOwner = normalizeOwner(owner);
    const cart = await this.cartRepository.findRawByOwner(normalizedOwner);
    if (!cart) throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await this.cartRepository.save(cart);
    return this.cartRepository.findByOwner(normalizedOwner);
  }

  async clearCart(owner) {
    const normalizedOwner = normalizeOwner(owner);
    const cart = await this.cartRepository.clearItemsByOwner(normalizedOwner);
    if (!cart) {
      await this.cartRepository.createForOwner(normalizedOwner, guestExpiryOptions(owner));
      return this.cartRepository.findByOwner(normalizedOwner);
    }
    return this.cartRepository.findByOwner(normalizedOwner);
  }

  async mergeGuestCartIntoUser(userId, guestCartToken) {
    if (!guestCartToken) return this.getCart({ userId });

    const guestOwner = { cartTokenHash: hashSha256(guestCartToken) };
    const userOwner = { userId };

    const [guestCart, userCart] = await Promise.all([
      this.cartRepository.findRawByOwner(guestOwner),
      this.cartRepository.findRawByOwner(userOwner)
    ]);

    if (!guestCart || !guestCart.items.length) {
      return this.getCart(userOwner);
    }

    const targetCart = userCart || (await this.cartRepository.createForOwner(userOwner));

    for (const item of guestCart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || product.isActive === false || product.stock <= 0) continue;

      const guestQty = Math.max(1, Number(item.quantity || 1));
      const existing = targetCart.items.find(
        (targetItem) => targetItem.productId.toString() === item.productId.toString()
      );
      const currentQty = existing ? existing.quantity : 0;
      const mergedQty = Math.min(product.stock, currentQty + guestQty);

      if (existing) {
        existing.quantity = mergedQty;
        existing.priceSnapshot = getProductPrice(product);
        existing.productNameSnapshot = product.name || product.product_name_vn || '';
        existing.imageSnapshot = getProductImage(product);
      } else {
        targetCart.items.push({
          productId: item.productId,
          quantity: mergedQty,
          priceSnapshot: getProductPrice(product),
          productNameSnapshot: product.name || product.product_name_vn || '',
          imageSnapshot: getProductImage(product),
          selectedVariant: item.selectedVariant || null
        });
      }
    }

    await this.cartRepository.save(targetCart);
    await this.cartRepository.markConverted(guestOwner);

    await this.eventPublisher?.publishCartMerged({
      userId,
      guestCartId: guestCart._id.toString(),
      mergedAt: new Date().toISOString()
    });

    return this.cartRepository.findByOwner(userOwner);
  }
}

const normalizeOwner = (owner = {}) => {
  if (owner.userId) return { userId: owner.userId };
  if (owner.cartToken) return { cartTokenHash: hashSha256(owner.cartToken) };
  if (owner.cartTokenHash) return { cartTokenHash: owner.cartTokenHash };
  throw new AppError('Cart owner is required', 400, 'CART_OWNER_REQUIRED');
};

const guestExpiryOptions = (owner = {}) => {
  if (!owner || owner.userId) return {};
  return {
    expiresAt: new Date(Date.now() + env.guestCartTtlDays * 24 * 60 * 60 * 1000)
  };
};

const getProductPrice = (product) => Number(product.sale_price ?? product.price ?? 0);

const getProductImage = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
  return product.image_url || '';
};

module.exports = CartService;
