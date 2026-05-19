const Cart = require('../models/CartModel');
const { CART_STATUSES } = require('../../../shared/constants/cart');

class MongoCartRepository {
  async findByOwner(owner, options = {}) {
    const populate = options.populate !== false;
    let query = Cart.findOne({
      ...ownerFilter(owner),
      status: CART_STATUSES.ACTIVE
    });
    if (populate) query = query.populate('items.productId');
    return query;
  }

  async findRawByOwner(owner) {
    return Cart.findOne({
      ...ownerFilter(owner),
      status: CART_STATUSES.ACTIVE
    });
  }

  async save(cart) {
    return cart.save();
  }

  async createForOwner(owner, options = {}) {
    const filter = {
      ...ownerFilter(owner),
      status: CART_STATUSES.ACTIVE
    };

    const insertDoc = {
      status: CART_STATUSES.ACTIVE,
      expiresAt: options.expiresAt || null,
      items: []
    };

    if (owner.userId) {
      insertDoc.userId = owner.userId;
      insertDoc.cartTokenHash = null;
    } else if (owner.cartTokenHash) {
      insertDoc.userId = null;
      insertDoc.cartTokenHash = owner.cartTokenHash;
    }

    return Cart.findOneAndUpdate(
      filter,
      { $setOnInsert: insertDoc },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: false
      }
    );
  }

  async clearItemsByOwner(owner) {
    return Cart.findOneAndUpdate(
      {
        ...ownerFilter(owner),
        status: CART_STATUSES.ACTIVE
      },
      {
        $set: {
          items: []
        }
      },
      { new: true }
    );
  }

  async markConverted(owner) {
    return Cart.findOneAndUpdate(
      {
        ...ownerFilter(owner),
        status: CART_STATUSES.ACTIVE
      },
      {
        $set: {
          status: CART_STATUSES.CONVERTED,
          expiresAt: new Date(),
          items: []
        }
      },
      { new: true }
    );
  }
}

const ownerFilter = (owner = {}) => {
  if (owner.userId) return { userId: owner.userId };
  if (owner.cartTokenHash) return { cartTokenHash: owner.cartTokenHash };
  throw new Error('Cart owner is required');
};

module.exports = MongoCartRepository;
