import { BusinessLogicError, ConflictError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';

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

function cleanObject(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

export default class CategoryService {
  constructor({ categoryRepository } = {}) {
    this.categoryRepository = categoryRepository;
  }

  async listCategories({ activeOnly = true, includeProductCount = false } = {}) {
    requireDependency(this.categoryRepository, 'Category');
    if (includeProductCount) return this.categoryRepository.findWithProductCount();
    if (activeOnly) return this.categoryRepository.findActive();
    const result = await this.categoryRepository.find({}, { limit: 0, orderBy: 'category_name', orderDirection: 'asc' });
    return result.data;
  }

  async getCategoryById(categoryId) {
    requireDependency(this.categoryRepository, 'Category');
    const id = toPositiveInteger(categoryId, 'category_id');
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async getCategoryWithProducts(categoryId) {
    requireDependency(this.categoryRepository, 'Category');
    const id = toPositiveInteger(categoryId, 'category_id');
    const category = await this.categoryRepository.findWithProducts(id);
    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async createCategory(categoryData = {}) {
    requireDependency(this.categoryRepository, 'Category');
    const data = await this._validateCategoryPayload(categoryData, { requireName: true });
    await this._ensureNameAvailable(data.category_name);
    return this.categoryRepository.create(data);
  }

  async updateCategory(categoryId, categoryData = {}) {
    requireDependency(this.categoryRepository, 'Category');
    const id = toPositiveInteger(categoryId, 'category_id');
    await this.getCategoryById(id);
    const data = await this._validateCategoryPayload(categoryData, { requireName: false });
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }
    if (data.category_name) await this._ensureNameAvailable(data.category_name, id);
    return this.categoryRepository.updateById(id, data);
  }

  async deleteCategory(categoryId) {
    requireDependency(this.categoryRepository, 'Category');
    const id = toPositiveInteger(categoryId, 'category_id');
    await this.getCategoryById(id);
    const activeShoesCount = await this.categoryRepository.checkActiveShoesCount(id);
    if (activeShoesCount > 0) {
      throw new BusinessLogicError('Cannot delete a category that still has active products');
    }
    return this.categoryRepository.softDelete(id);
  }

  async restoreCategory(categoryId) {
    requireDependency(this.categoryRepository, 'Category');
    const id = toPositiveInteger(categoryId, 'category_id');
    return this.categoryRepository.restore(id);
  }

  async countCategories() {
    requireDependency(this.categoryRepository, 'Category');
    if (this.categoryRepository.countAll) return this.categoryRepository.countAll();
    return this.categoryRepository.count();
  }

  async _validateCategoryPayload(categoryData, { requireName }) {
    const rawName = categoryData.category_name ?? categoryData.name;
    if (requireName && rawName === undefined) {
      throw new ValidationError('Validation failed', [{ field: 'category_name', message: 'category_name is required' }]);
    }
    if (rawName !== undefined && String(rawName).trim().length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'category_name', message: 'category_name cannot be empty' }]);
    }

    return cleanObject({
      category_name: rawName !== undefined ? String(rawName).trim() : undefined,
      description: categoryData.description,
      image_url: categoryData.image_url,
      is_active: categoryData.is_active
    });
  }

  async _ensureNameAvailable(categoryName, excludeCategoryId = null) {
    const existing = await this.categoryRepository.findByName(categoryName, excludeCategoryId);
    if (existing) throw new ConflictError('Category name already exists');
  }
}
