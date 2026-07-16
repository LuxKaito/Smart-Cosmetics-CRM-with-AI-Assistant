class Product {
  constructor({ id, name, price, brand, category_level_1, category_level_2, benefits, product_type, skin_type, rating = 0 }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.brand = brand;
    this.category_level_1 = category_level_1;
    this.category_level_2 = category_level_2;
    this.benefits = benefits;
    this.product_type = product_type;
    this.skin_type = skin_type;
    this.rating = rating;
  }
}

module.exports = Product;
