const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240
    },
    product_name_vn: {
      type: String,
      trim: true,
      maxlength: 240,
      index: true
    },
    product_name_en: {
      type: String,
      trim: true,
      maxlength: 240,
      index: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    price: {
      type: Number,
      min: 0
    },
    sale_price: {
      type: Number,
      min: 0,
      index: true,
      required: true
    },
    original_price: {
      type: Number,
      min: 0
    },
    image_url: {
      type: String,
      trim: true
    },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    description: {
      type: String,
      trim: true
    },
    skin_type: {
      type: String,
      trim: true,
      index: true
    },
    volume: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true,
      index: true
    },
    origin: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      index: true
    },
    categories: [
      {
        type: String,
        trim: true,
        index: true
      }
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    review_count: {
      type: Number,
      min: 0,
      default: 0
    },
    qa_count: {
      type: Number,
      min: 0,
      default: 0
    },
    stock: {
      type: Number,
      min: 0,
      default: 0
    },
    soldCount: {
      type: Number,
      min: 0,
      default: 0,
      index: true
    },
    sourceId: {
      type: String,
      index: true,
      sparse: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

productSchema.index({
  name: 'text',
  product_name_vn: 'text',
  product_name_en: 'text',
  description: 'text',
  brand: 'text',
  categories: 'text',
  category: 'text',
  subcategory: 'text'
});
productSchema.index({ brand: 1, categories: 1, sale_price: 1 });

productSchema.pre('validate', function normalizeFields(next) {
  const primaryName = this.product_name_vn || this.product_name_en || this.name;
  if (!this.name && primaryName) this.name = primaryName;
  if (!this.product_name_vn && this.name) this.product_name_vn = this.name;

  if ((this.sale_price === undefined || this.sale_price === null) && this.price !== undefined && this.price !== null) {
    this.sale_price = this.price;
  }
  if (Array.isArray(this.images)) {
    this.images = [...new Set(this.images.map((image) => String(image || '').trim()).filter(Boolean))];
  }

  if (this.image_url && (!this.images || !this.images.length)) {
    this.images = [this.image_url];
  }
  if ((!this.image_url || !String(this.image_url).trim()) && this.images && this.images.length) {
    this.image_url = this.images[0];
  }

  if (Array.isArray(this.categories)) {
    this.categories = [...new Set(this.categories.map((category) => String(category || '').trim()).filter(Boolean))];
  }

  if (this.category && (!this.categories || !this.categories.length)) {
    this.categories = [this.category];
  }
  if ((!this.category || !String(this.category).trim()) && this.categories && this.categories.length) {
    this.category = this.categories[0];
  }

  if (!this.subcategory && this.categories && this.categories.length > 1) {
    this.subcategory = this.categories[1];
  }
  if (this.subcategory && this.categories && !this.categories.includes(this.subcategory)) {
    this.categories.push(this.subcategory);
  }
  if (this.category && this.categories && !this.categories.includes(this.category)) {
    this.categories.unshift(this.category);
  }

  next();
});

productSchema.pre('validate', function createSlug(next) {
  if (!this.slug && this.name) {
    const suffix = this.brand ? `-${this.brand}` : '';
    this.slug = slugify(`${this.name}${suffix}`, { lower: true, strict: true }).slice(0, 220);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
