const mongoose = require('mongoose');
const slugify = require('slugify');

const productVariantSchema = new mongoose.Schema(
  {
    product_id: { type: String, trim: true },
    variant_id: { type: String, trim: true },
    variant_title: { type: String, trim: true },
    option1: { type: String, trim: true },
    option2: { type: String, trim: true },
    option3: { type: String, trim: true },
    sale_price: { type: Number, min: 0 },
    original_price: { type: Number, min: 0 },
    available: { type: Boolean },
    inventory_quantity: { type: Number },
    barcode: { type: String, trim: true },
    sku: { type: String, trim: true },
    image_url: { type: String, trim: true },
    product_url: { type: String, trim: true }
  },
  { _id: false }
);

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
    sku: {
      type: String,
      trim: true,
      index: true
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
    image_count: { type: Number, min: 0 },
    images: [
      {
        type: String,
        trim: true
      }
    ],
    variants: {
      type: [productVariantSchema],
      default: []
    },
    description: {
      type: String,
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true
    },
    detailDescription: {
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
    category_level_1: {
      type: String,
      trim: true,
      index: true
    },
    category_level_2: {
      type: String,
      trim: true,
      index: true
    },
    category_level_3: {
      type: String,
      trim: true,
      index: true
    },
    category_level_4: {
      type: String,
      trim: true,
      index: true
    },
    category_path: {
      type: [String],
      default: []
    },
    benefits: {
      type: String,
      trim: true,
      index: true
    },
    product_type: {
      type: String,
      trim: true,
      index: true
    },
    ingredients: {
      type: String,
      trim: true
    },
    main_ingredients: { type: String, trim: true },
    full_ingredients: { type: String, trim: true },
    usage_instructions: {
      type: String,
      trim: true
    },
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
    available: { type: Boolean, default: true, index: true },
    source_total_inventory: { type: Number },
    variant_count: { type: Number, min: 0 },
    price_min: { type: Number, min: 0 },
    price_max: { type: Number, min: 0 },
    short_description: { type: String, trim: true },
    seo_title: { type: String, trim: true },
    brand_story: { type: String, trim: true },
    specs: { type: String, trim: true },
    made_in: { type: String, trim: true },
    warnings: { type: String, trim: true },
    storage: { type: String, trim: true },
    scent_notes: { type: String, trim: true },
    promo_note: { type: String, trim: true },
    source_product_type: { type: String, trim: true },
    source_product_url: { type: String, trim: true },
    source_tags: { type: String, trim: true },
    category_map_status: { type: String, trim: true },
    source: { type: String, trim: true, index: true },
    source_data: { type: mongoose.Schema.Types.Mixed, select: false },
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
  shortDescription: 'text',
  detailDescription: 'text',
  brand: 'text',
  category_level_1: 'text',
  category_level_2: 'text',
  category_level_3: 'text',
  category_level_4: 'text',
  benefits: 'text',
  product_type: 'text',
  ingredients: 'text',
  usage_instructions: 'text'
});
productSchema.index({ brand: 1, category_level_2: 1, category_level_3: 1, category_level_4: 1, sale_price: 1 });

productSchema.pre('validate', function normalizeFields(next) {
  const primaryName = this.product_name_vn || this.product_name_en || this.name;
  if (!this.name && primaryName) this.name = primaryName;
  if (!this.product_name_vn && this.name) this.product_name_vn = this.name;

  if (Array.isArray(this.images)) {
    this.images = [...new Set(this.images.map((image) => String(image || '').trim()).filter(Boolean))];
  }

  if (this.image_url && (!this.images || !this.images.length)) {
    this.images = [this.image_url];
  }
  if ((!this.image_url || !String(this.image_url).trim()) && this.images && this.images.length) {
    this.image_url = this.images[0];
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
