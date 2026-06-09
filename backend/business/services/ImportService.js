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

function toPositiveNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be greater than zero` }]);
  }
  return parsed;
}

export default class ImportService {
  constructor({ importRepository, variantRepository } = {}) {
    this.importRepository = importRepository;
    this.variantRepository = variantRepository;
  }

  async listImports({ filters = {}, pagination = {} } = {}) {
    requireDependency(this.importRepository, 'Import');
    return this.importRepository.findAllWithDetails(filters, pagination);
  }

  async getImportById(importId) {
    requireDependency(this.importRepository, 'Import');
    const id = toPositiveInteger(importId, 'import_id');
    const importRecord = await this.importRepository.findById(id);
    if (!importRecord) throw new NotFoundError('Import');
    return importRecord;
  }

  async createImports(userId, imports = [], { notes = null } = {}) {
    requireDependency(this.importRepository, 'Import');
    requireDependency(this.variantRepository, 'Variant');
    if (!Array.isArray(imports) || imports.length === 0) {
      throw new ValidationError('Validation failed', [{ field: 'imports', message: 'imports must be a non-empty array' }]);
    }

    const normalizedImports = [];
    for (const item of imports) {
      const normalized = await this._normalizeImportItem(item);
      normalizedImports.push(normalized);
    }

    const created = await this.importRepository.batchCreate(normalizedImports, userId, notes);

    return {
      imports: created,
      count: created.length
    };
  }

  async createImport(userId, importData = {}) {
    return this.createImports(userId, [importData], { notes: importData.notes ?? null });
  }

  async deleteImport(importId) {
    requireDependency(this.importRepository, 'Import');
    requireDependency(this.variantRepository, 'Variant');
    const importRecord = await this.getImportById(importId);
    const stock = await this.variantRepository.findStockById(importRecord.variant_id);
    if (!stock) throw new NotFoundError('Variant');
    const nextStock = Math.max(0, Number(stock.stock_quantity || 0) - Number(importRecord.quantity_imported || 0));
    await this.variantRepository.setStockQuantity(importRecord.variant_id, nextStock);
    await this.importRepository.deleteById(importRecord.import_id);
    return { deleted: true, stock_quantity: nextStock };
  }

  async getStatistics(filters = {}) {
    requireDependency(this.importRepository, 'Import');
    return this.importRepository.getStatistics(filters);
  }

  async _normalizeImportItem(item) {
    const variantId = toPositiveInteger(item.variant_id, 'variant_id');
    const quantityImported = toPositiveInteger(item.quantity_imported ?? item.quantity, 'quantity_imported');
    const importPrice = toPositiveNumber(item.import_price ?? item.price, 'import_price');
    const variant = await this.variantRepository.findStockById(variantId);
    if (!variant) throw new NotFoundError('Variant');

    return {
      variant_id: variantId,
      supplier_id: item.supplier_id !== undefined ? toPositiveInteger(item.supplier_id, 'supplier_id') : undefined,
      quantity_imported: quantityImported,
      import_price: importPrice,
      notes: item.notes,
      import_date: item.import_date
    };
  }

  async _increaseStocks(imports) {
    for (const item of imports) {
      const current = await this.variantRepository.findStockById(item.variant_id);
      const nextStock = Number(current.stock_quantity || 0) + Number(item.quantity_imported || 0);
      await this.variantRepository.setStockQuantity(item.variant_id, nextStock);
    }
  }
}
