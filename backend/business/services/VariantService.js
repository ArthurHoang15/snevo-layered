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

function toNonNegativeInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a non-negative integer` }]);
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

export default class VariantService {
  constructor({ variantRepository, shoeRepository, colorRepository, sizeRepository } = {}) {
    this.variantRepository = variantRepository;
    this.shoeRepository = shoeRepository;
    this.colorRepository = colorRepository;
    this.sizeRepository = sizeRepository;
  }

  async listVariantsByProduct(productId) {
    requireDependency(this.variantRepository, 'Variant');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    return this.variantRepository.findByShoeId(shoeId);
  }

  async getVariantById(variantId) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    const variant = await this.variantRepository.findById(id);
    if (!variant) throw new NotFoundError('Variant');
    return variant;
  }

  async createVariant(variantData = {}) {
    requireDependency(this.variantRepository, 'Variant');
    const data = await this._validateVariantPayload(variantData, { requireCoreFields: true });
    await this._ensureCompositeAvailable(data.shoe_id, data.color_id, data.size_id);
    if (data.sku) await this._ensureSkuAvailable(data.sku);
    return this.variantRepository.create(data);
  }

  async updateVariant(variantId, variantData = {}) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    const existing = await this.getVariantById(id);
    const data = await this._validateVariantPayload(variantData, { requireCoreFields: false });
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    }

    const nextShoeId = data.shoe_id ?? existing.shoe_id;
    const nextColorId = data.color_id ?? existing.color_id;
    const nextSizeId = data.size_id ?? existing.size_id;
    if (data.shoe_id || data.color_id || data.size_id) {
      const duplicate = await this.variantRepository.findByComposite(nextShoeId, nextColorId, nextSizeId);
      if (duplicate && duplicate.variant_id !== id) {
        throw new ConflictError('Variant already exists for this product, color, and size');
      }
    }
    if (data.sku && data.sku !== existing.sku) await this._ensureSkuAvailable(data.sku);
    return this.variantRepository.update(id, data);
  }

  async softDeleteVariant(variantId) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    await this.getVariantById(id);
    return this.variantRepository.softDeleteVariant(id);
  }

  async restoreVariant(variantId) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    return this.variantRepository.restoreVariant(id);
  }

  async setStock(variantId, stockQuantity) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    const quantity = toNonNegativeInteger(stockQuantity, 'stock_quantity');
    return this.variantRepository.setStockQuantity(id, quantity);
  }

  async increaseStock(variantId, quantity) {
    return this.adjustStock(variantId, { operation: 'add', quantity });
  }

  async decreaseStock(variantId, quantity, { clamp = false } = {}) {
    return this.adjustStock(variantId, { operation: 'subtract', quantity, clamp });
  }

  async adjustStock(variantId, { operation = 'set', quantity, clamp = false } = {}) {
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(variantId, 'variant_id');
    const normalizedQuantity = toNonNegativeInteger(quantity, 'quantity');
    const current = await this.variantRepository.findStockById(id);
    if (!current) throw new NotFoundError('Variant');
    const currentStock = Number(current.stock_quantity || 0);
    let nextStock;

    if (operation === 'add') {
      nextStock = currentStock + normalizedQuantity;
    } else if (operation === 'subtract') {
      if (!clamp && currentStock < normalizedQuantity) {
        throw new BusinessLogicError('Insufficient stock available');
      }
      nextStock = Math.max(0, currentStock - normalizedQuantity);
    } else if (operation === 'set') {
      nextStock = normalizedQuantity;
    } else {
      throw new ValidationError('Validation failed', [{ field: 'operation', message: 'operation is not supported' }]);
    }

    return this.variantRepository.setStockQuantity(id, nextStock);
  }

  async listLowStock(threshold = 10) {
    requireDependency(this.variantRepository, 'Variant');
    const normalizedThreshold = toNonNegativeInteger(threshold, 'threshold');
    return this.variantRepository.findLowStock(normalizedThreshold);
  }

  async generateVariants(productId, { color_ids = [], size_ids = [], stock_quantity = 0, variant_price = undefined } = {}) {
    requireDependency(this.variantRepository, 'Variant');
    const shoeId = toPositiveInteger(productId, 'shoe_id');
    const colorIds = this._normalizeIdList(color_ids, 'color_ids');
    const sizeIds = this._normalizeIdList(size_ids, 'size_ids');
    if (colorIds.length === 0 || sizeIds.length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'variants', message: 'color_ids and size_ids are required' }]);
    }

    const variants = [];
    for (const colorId of colorIds) {
      for (const sizeId of sizeIds) {
        variants.push({
          shoe_id: shoeId,
          color_id: colorId,
          size_id: sizeId,
          stock_quantity: toNonNegativeInteger(stock_quantity, 'stock_quantity'),
          variant_price: variant_price !== undefined ? toNonNegativeNumber(variant_price, 'variant_price') : undefined,
          sku: this.generateSku(shoeId, colorId, sizeId),
          is_active: true
        });
      }
    }

    const created = await this.variantRepository.bulkCreate(variants);
    return {
      created,
      created_count: created.length,
      skipped_count: variants.length - created.length
    };
  }

  generateSku(shoeId, colorId, sizeId) {
    return `SHOE-${shoeId}-${colorId}-${sizeId}`;
  }

  async _validateVariantPayload(variantData, { requireCoreFields }) {
    const errors = [];
    for (const field of ['shoe_id', 'color_id', 'size_id']) {
      if (requireCoreFields && variantData[field] === undefined) {
        errors.push({ field, message: `${field} is required` });
      }
    }
    if (errors.length > 0) throw new ValidationError('Validation failed', errors);

    const data = cleanObject({
      shoe_id: variantData.shoe_id !== undefined ? toPositiveInteger(variantData.shoe_id, 'shoe_id') : undefined,
      color_id: variantData.color_id !== undefined ? toPositiveInteger(variantData.color_id, 'color_id') : undefined,
      size_id: variantData.size_id !== undefined ? toPositiveInteger(variantData.size_id, 'size_id') : undefined,
      stock_quantity: variantData.stock_quantity !== undefined ? toNonNegativeInteger(variantData.stock_quantity, 'stock_quantity') : undefined,
      variant_price: variantData.variant_price !== undefined ? toNonNegativeNumber(variantData.variant_price, 'variant_price') : undefined,
      sku: variantData.sku,
      is_active: variantData.is_active
    });

    await this._ensureReferencedRecords(data);
    if (!data.sku && data.shoe_id && data.color_id && data.size_id) {
      data.sku = this.generateSku(data.shoe_id, data.color_id, data.size_id);
    }
    return data;
  }

  async _ensureReferencedRecords(data) {
    if (data.shoe_id && this.shoeRepository) {
      const product = await this.shoeRepository.findById(data.shoe_id);
      if (!product) throw new NotFoundError('Product');
    }
    if (data.color_id && this.colorRepository) {
      const color = await this.colorRepository.findById(data.color_id);
      if (!color) throw new NotFoundError('Color');
    }
    if (data.size_id && this.sizeRepository) {
      const size = await this.sizeRepository.findById(data.size_id);
      if (!size) throw new NotFoundError('Size');
    }
  }

  async _ensureCompositeAvailable(shoeId, colorId, sizeId) {
    const existing = await this.variantRepository.findByComposite(shoeId, colorId, sizeId);
    if (existing) throw new ConflictError('Variant already exists for this product, color, and size');
  }

  async _ensureSkuAvailable(sku) {
    const existing = await this.variantRepository.findBySku(sku);
    if (existing) throw new ConflictError('Variant SKU already exists');
  }

  _normalizeIdList(values, field) {
    const source = Array.isArray(values) ? values : String(values || '').split(',');
    return source
      .map((value) => toPositiveInteger(value, field))
      .filter((value, index, array) => array.indexOf(value) === index);
  }
}
