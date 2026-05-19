class Order {
  constructor({ id, user, items = [], totalAmount = 0, status = 'pending' }) {
    this.id = id;
    this.user = user;
    this.items = items;
    this.totalAmount = totalAmount;
    this.status = status;
  }
}

module.exports = Order;
