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

  async findStockById(variantId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('variant_id, stock_quantity')
        .eq(this.primaryKey, variantId)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find variant stock', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find variant stock failed: ${error.message}`, error);
    }
  }

  async setStockQuantity(variantId, stockQuantity) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .update({ stock_quantity: stockQuantity })
        .eq(this.primaryKey, variantId)
        .select('*, shoes(shoe_id, shoe_name, base_price, image_url), colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .single();
      if (error) throw new DatabaseError('Failed to set variant stock quantity', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Set variant stock quantity failed: ${error.message}`, error);
    }
  }

  async update(variantId, updateData) {
    return this.updateById(variantId, updateData);
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
      const variants = (variantsData || []).map((item) => this.cleanData(item));
      if (variants.length === 0) return [];

      const shoeIds = [...new Set(variants.map((variant) => variant.shoe_id).filter(Boolean))];
      const { data: existingVariants, error: existingError } = await this.db
        .from(this.tableName)
        .select('shoe_id, color_id, size_id')
        .in('shoe_id', shoeIds);
      if (existingError) throw new DatabaseError('Failed to check existing variants', existingError);

      const existingSet = new Set(
        (existingVariants || []).map((variant) => `${variant.shoe_id}-${variant.color_id}-${variant.size_id}`)
      );
      const variantsToCreate = variants.filter((variant) => {
        const key = `${variant.shoe_id}-${variant.color_id}-${variant.size_id}`;
        if (existingSet.has(key)) return false;
        existingSet.add(key);
        return true;
      });

      if (variantsToCreate.length === 0) return [];

      const { data, error } = await this.db
        .from(this.tableName)
        .insert(variantsToCreate)
        .select();
      if (error) throw new DatabaseError('Failed to bulk create variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Bulk create variants failed: ${error.message}`, error);
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

  async findAllDeletedWithDetails() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(shoe_id, shoe_name, image_url, is_active), colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('is_active', false)
        .order('variant_id', { ascending: true });
      if (error) throw new DatabaseError('Failed to find all deleted variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find all deleted variants failed: ${error.message}`, error);
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
