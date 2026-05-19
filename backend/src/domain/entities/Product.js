class Product {
  constructor({ id, name, price, brand, category, skin_type, rating = 0 }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.brand = brand;
    this.category = category;
    this.skin_type = skin_type;
    this.rating = rating;
  }
}

module.exports = Product;
