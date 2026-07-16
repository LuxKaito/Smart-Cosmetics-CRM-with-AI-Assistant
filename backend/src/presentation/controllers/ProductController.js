const { success } = require('../../shared/utils/apiResponse');

class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  list = async (req, res) => {
    const result = await this.productService.list(req.query);
    return success(res, result);
  };

  search = async (req, res) => {
    const result = await this.productService.list({
      ...req.query,
      search: req.query.search || req.query.q
    });
    return success(res, result);
  };

  listByCategory = async (req, res) => {
    const result = await this.productService.list({
      ...req.query,
      category: req.params.category
    });
    return success(res, result);
  };

  categories = async (req, res) => {
    const result = await this.productService.listCategories();
    return success(res, result);
  };

  detail = async (req, res) => {
    const product = await this.productService.getById(req.params.slug || req.params.id);
    return success(res, { product });
  };

  create = async (req, res) => {
    const product = await this.productService.create(withUploadedImages(req));
    return success(res, { product }, 'Product created', 201);
  };

  update = async (req, res) => {
    const product = await this.productService.update(req.params.id, withUploadedImages(req));
    return success(res, { product }, 'Product updated');
  };

  remove = async (req, res) => {
    const result = await this.productService.delete(req.params.id);
    return success(res, result, 'Product deleted');
  };
}

const withUploadedImages = (req) => {
  const imageUrls = (req.files || []).map((file) => `/uploads/products/${file.filename}`);
  if (!imageUrls.length) return req.body;

  const existingImages = Array.isArray(req.body.images)
    ? req.body.images
    : req.body.images
    ? [req.body.images]
    : [];

  return {
    ...req.body,
    images: [...existingImages, ...imageUrls]
  };
};

module.exports = ProductController;
