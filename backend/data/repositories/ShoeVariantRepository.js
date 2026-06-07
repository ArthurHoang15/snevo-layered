import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ShoeVariantRepository extends BaseRepository {
  constructor() {
    super('shoe_variants', 'variant_id');
  }

  async findByShoeId(shoeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(shoe_id, shoe_name, base_price, image_url), colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('shoe_id', shoeId)
        .eq('is_active', true)
        .order('variant_id', { ascending: true });
      if (error) throw new DatabaseError('Failed to find variants by shoe', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find variants by shoe failed: ${error.message}`, error);
    }
  }

  async findBySku(sku) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(shoe_name, base_price), colors(color_name, hex_code), sizes(size_value, size_type)')
        .eq('sku', sku)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find variant by SKU', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find variant by SKU failed: ${error.message}`, error);
    }
  }

  async findByComposite(shoeId, colorId, sizeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(shoe_name, image_url), colors(color_name, hex_code), sizes(size_value)')
        .eq('shoe_id', shoeId)
        .eq('color_id', colorId)
        .eq('size_id', sizeId)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find variant by composite key', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find variant by composite key failed: ${error.message}`, error);
    }
  }

  async updateStock(variantId, quantity, operation = 'set') {
    try {
      const { data: variant, error: findError } = await this.db
        .from(this.tableName)
        .select('stock_quantity')
        .eq(this.primaryKey, variantId)
        .single();
      if (findError) throw new DatabaseError('Failed to find variant stock', findError);
      const currentStock = Number(variant.stock_quantity || 0);
      const stockQuantity = operation === 'increment'
        ? currentStock + quantity
        : operation === 'decrement'
          ? currentStock - quantity
          : quantity;
      const { data, error } = await this.db
        .from(this.tableName)
        .update({ stock_quantity: stockQuantity })
        .eq(this.primaryKey, variantId)
        .select('*, shoes(shoe_id, shoe_name, base_price, image_url), colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .single();
      if (error) throw new DatabaseError('Failed to update variant stock', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update variant stock failed: ${error.message}`, error);
    }
  }

  async update(variantId, updateData) {
    return this.updateById(variantId, updateData);
  }

  async checkStock(variantId, requestedQuantity) {
    const variant = await this.findById(variantId);
    if (!variant) return { available: false, current_stock: 0 };
    const currentStock = Number(variant.stock_quantity || 0);
    return { available: currentStock >= requestedQuantity, current_stock: currentStock };
  }

  async findLowStock(threshold = 10) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(shoe_name, image_url), colors(color_name), sizes(size_value)')
        .lte('stock_quantity', threshold)
        .eq('is_active', true)
        .order('stock_quantity', { ascending: true });
      if (error) throw new DatabaseError('Failed to find low stock variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find low stock variants failed: ${error.message}`, error);
    }
  }

  async bulkCreate(variantsData) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(variantsData.map((item) => this.cleanData(item)))
        .select();
      if (error) throw new DatabaseError('Failed to bulk create variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Bulk create variants failed: ${error.message}`, error);
    }
  }

  async _checkLowStockAlert(variantId, currentStock) {
    return { variant_id: variantId, low_stock: currentStock <= 10, current_stock: currentStock };
  }

  generateSKU(shoeName, colorId, sizeId) {
    const prefix = String(shoeName || 'SHOE').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
    return prefix + '-C' + colorId + '-S' + sizeId;
  }

  async generateAllVariants(shoeId, options = {}) {
    try {
      const { data: shoe, error: shoeError } = await this.db.from('shoes').select('shoe_name').eq('shoe_id', shoeId).single();
      if (shoeError) throw new DatabaseError('Failed to find shoe', shoeError);
      const { data: colors, error: colorError } = await this.db.from('colors').select('color_id').eq('is_active', true);
      if (colorError) throw new DatabaseError('Failed to find colors', colorError);
      const { data: sizes, error: sizeError } = await this.db.from('sizes').select('size_id').eq('is_active', true);
      if (sizeError) throw new DatabaseError('Failed to find sizes', sizeError);
      const variants = [];
      for (const color of colors || []) {
        for (const size of sizes || []) {
          variants.push({
            shoe_id: shoeId,
            color_id: color.color_id,
            size_id: size.size_id,
            sku: this.generateSKU(shoe.shoe_name, color.color_id, size.size_id),
            stock_quantity: options.stock_quantity ?? 0,
            price_adjustment: options.price_adjustment ?? 0,
            is_active: true
          });
        }
      }
      return this.bulkCreate(variants);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Generate all variants failed: ${error.message}`, error);
    }
  }

  async generateSpecificVariants(shoeId, colorIds, sizeIds, options = {}) {
    try {
      const { data: shoe, error: shoeError } = await this.db.from('shoes').select('shoe_name').eq('shoe_id', shoeId).single();
      if (shoeError) throw new DatabaseError('Failed to find shoe', shoeError);
      const variants = [];
      for (const colorId of colorIds || []) {
        for (const sizeId of sizeIds || []) {
          variants.push({
            shoe_id: shoeId,
            color_id: colorId,
            size_id: sizeId,
            sku: this.generateSKU(shoe.shoe_name, colorId, sizeId),
            stock_quantity: options.stock_quantity ?? 0,
            price_adjustment: options.price_adjustment ?? 0,
            is_active: true
          });
        }
      }
      return this.bulkCreate(variants);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Generate specific variants failed: ${error.message}`, error);
    }
  }

  async softDeleteVariant(variantId) {
    return super.softDelete(variantId);
  }

  async restoreVariant(variantId) {
    return super.restore(variantId);
  }

  async getDeletedVariants(shoeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('shoe_id', shoeId)
        .eq('is_active', false);
      if (error) throw new DatabaseError('Failed to get deleted variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get deleted variants failed: ${error.message}`, error);
    }
  }

  async getAllShoesWithDeletedVariants() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('shoe_id, shoes(shoe_id, shoe_name, image_url), colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('is_active', false);
      if (error) throw new DatabaseError('Failed to get shoes with deleted variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get shoes with deleted variants failed: ${error.message}`, error);
    }
  }

  async countAll() {
    return this.count();
  }

  async getLowStockCount(threshold = 10) {
    try {
      const { count, error } = await this.db
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('stock_quantity', threshold);
      if (error) throw new DatabaseError('Failed to count low stock variants', error);
      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get low stock count failed: ${error.message}`, error);
    }
  }
}
