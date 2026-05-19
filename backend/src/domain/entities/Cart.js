class Cart {
  constructor({ id, user, items = [] }) {
    this.id = id;
    this.user = user;
    this.items = items;
  }
}

module.exports = Cart;
