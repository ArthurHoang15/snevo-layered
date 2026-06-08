import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';

function requireDependency(value, name) {
  if (!value) throw new BusinessLogicError(`${name} repository is required`);
}

function toPositiveInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a positive integer` }]);
  }
  return parsed;
}

function toNonNegativeNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a non-negative number` }]);
  }
  return parsed;
}

function cleanObject(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export default class ProductService {
  constructor({ shoeRepository, categoryRepository, variantRepository } = {}) {
    this.shoeRepository = shoeRepository;
    this.categoryRepository = categoryRepository;
    this.variantRepository = variantRepository;
  }

  async listProducts({ filters = {}, pagination = {}, sortBy = 'created_at', sortOrder = 'desc' } = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    return this.shoeRepository.findAllWithFilters(filters, pagination, sortBy, sortOrder);
  }

  async getProductById(productId) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    const product = await this.shoeRepository.findByIdWithDetails(id);
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async searchProducts(searchTerm, { filters = {}, pagination = {} } = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    const term = typeof searchTerm === 'string' ? searchTerm.trim() : '';
    if (!term) {
      throw new ValidationError('Validation failed', [{ field: 'search', message: 'search is required' }]);
    }
    return this.shoeRepository.search(term, filters, pagination);
  }

  async getProductsByCategory(categoryId, { filters = {}, pagination = {} } = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(categoryId, 'category_id');
    return this.shoeRepository.findByCategory(id, filters, pagination);
  }

  async getFeaturedProducts(limit = 10) {
    requireDependency(this.shoeRepository, 'Shoe');
    const normalizedLimit = toPositiveInteger(limit, 'limit');
    return this.shoeRepository.getFeatured(normalizedLimit);
  }

  async getRelatedProducts(productId, limit = 4) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    const normalizedLimit = toPositiveInteger(limit, 'limit');
    return this.shoeRepository.getRelatedProducts(id, normalizedLimit);
  }

  async getProductVariants(productId) {
    const id = toPositiveInteger(productId, 'product_id');
    if (this.variantRepository) return this.variantRepository.findByShoeId(id);
    requireDependency(this.shoeRepository, 'Shoe');
    return this.shoeRepository.getVariants(id);
  }

  async getProductReviews(productId, pagination = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    return this.shoeRepository.getReviews(id, pagination);
  }

  async getRatingSummary(productId) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    return this.shoeRepository.getRatingSummary(id);
  }

  async createProduct(productData = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    const data = await this._validateProductPayload(productData, { requireCoreFields: true });
    return this.shoeRepository.create(data);
  }

  async updateProduct(productId, productData = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    await this.getProductById(id);
    const data = await this._validateProductPayload(productData, { requireCoreFields: false });
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }
    return this.shoeRepository.updateById(id, data);
  }

  async deleteProduct(productId) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    await this.getProductById(id);
    return this.shoeRepository.softDelete(id);
  }

  async restoreProduct(productId) {
    requireDependency(this.shoeRepository, 'Shoe');
    const id = toPositiveInteger(productId, 'product_id');
    return this.shoeRepository.restore(id);
  }

  async countProducts(filters = {}) {
    requireDependency(this.shoeRepository, 'Shoe');
    if (Object.keys(filters).length > 0) return this.shoeRepository.count(filters);
    if (this.shoeRepository.countAll) return this.shoeRepository.countAll();
    return this.shoeRepository.count();
  }

  async _validateProductPayload(productData, { requireCoreFields }) {
    const errors = [];
    const hasName = productData.shoe_name !== undefined || productData.name !== undefined;
    const shoeName = productData.shoe_name ?? productData.name;
    const categoryId = productData.category_id;
    const basePrice = productData.base_price ?? productData.price;

    if (requireCoreFields && !hasName) errors.push({ field: 'shoe_name', message: 'shoe_name is required' });
    if (hasName && String(shoeName).trim().length === 0) {
      errors.push({ field: 'shoe_name', message: 'shoe_name cannot be empty' });
    }

    if (requireCoreFields && categoryId === undefined) {
      errors.push({ field: 'category_id', message: 'category_id is required' });
    }

    if (requireCoreFields && basePrice === undefined) {
      errors.push({ field: 'base_price', message: 'base_price is required' });
    }

    if (errors.length > 0) throw new ValidationError('Validation failed', errors);

    const data = cleanObject({
      shoe_name: hasName ? String(shoeName).trim() : undefined,
      description: productData.description,
      category_id: categoryId !== undefined ? toPositiveInteger(categoryId, 'category_id') : undefined,
      base_price: basePrice !== undefined ? toNonNegativeNumber(basePrice, 'base_price') : undefined,
      image_url: productData.image_url,
      is_active: productData.is_active
    });

    if (data.category_id && this.categoryRepository) {
      const category = await this.categoryRepository.findById(data.category_id);
      if (!category) throw new NotFoundError('Category');
    }

    return data;
  }
}
