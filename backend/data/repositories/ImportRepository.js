import BaseRepository from './BaseRepository.js';
import { DatabaseError, NotFoundError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ImportRepository extends BaseRepository {
  constructor() {
    super('imports', 'import_id');
  }

  async findAllWithDetails(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'desc' } = pagination;
      const { variant_id, user_id, shoe_id, from_date, to_date } = filters;
      const offset = (page - 1) * limit;

      let query = this.db
        .from(this.tableName)
        .select(`
          *,
          profiles(full_name, email),
          shoe_variants(
            *,
            shoes(shoe_id, shoe_name, image_url),
            colors(color_id, color_name, hex_code),
            sizes(size_id, size_value, size_type)
          )
        `, { count: 'exact' });

      if (variant_id) query = query.eq('variant_id', variant_id);
      if (user_id) query = query.eq('user_id', user_id);
      if (from_date) query = query.gte('created_at', from_date);
      if (to_date) query = query.lte('created_at', to_date);
      if (shoe_id) query = query.eq('shoe_variants.shoe_id', shoe_id);

      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      if (limit > 0) query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to fetch imports with details', error);

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil((count || 0) / limit) : 1
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Fetch imports with details failed: ${error.message}`, error);
    }
  }

  async findByUserId(userId, options = {}) {
    return this.find({ user_id: userId }, options);
  }

  async findByVariantId(variantId, options = {}) {
    return this.find({ variant_id: variantId }, options);
  }

  async findByShoeId(shoeId, options = {}) {
    return this.findAllWithDetails({ shoe_id: shoeId }, options);
  }

  async findByDateRange(startDate, endDate = null, options = {}) {
    return this.findAllWithDetails({ from_date: startDate, to_date: endDate }, options);
  }

  async batchCreate(imports, userId, notes = null) {
    try {
      const payload = imports.map((item) => this.cleanData({
        variant_id: item.variant_id,
        user_id: userId,
        quantity: item.quantity,
        cost_price: item.cost_price,
        supplier_name: item.supplier_name,
        notes: item.notes ?? notes
      }));

      const { data, error } = await this.db
        .from(this.tableName)
        .insert(payload)
        .select();
      if (error) throw new DatabaseError('Failed to create import records', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Batch create imports failed: ${error.message}`, error);
    }
  }

  async getStatistics(filters = {}) {
    try {
      const result = await this.findAllWithDetails(filters, { page: 1, limit: 0 });
      const rows = result.data || [];
      const totalQuantity = rows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      const totalCost = rows.reduce((sum, item) => {
        return sum + Number(item.quantity || 0) * Number(item.cost_price || 0);
      }, 0);
      return {
        total_imports: result.total,
        total_quantity: totalQuantity,
        total_cost: totalCost
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get import statistics failed: ${error.message}`, error);
    }
  }

  async deleteWithStockReverse(importId) {
    try {
      const importRecord = await this.findById(importId);
      if (!importRecord) {
        throw new NotFoundError('Import');
      }

      const { error: stockError } = await this.db.rpc('update_variant_stock', {
        p_variant_id: importRecord.variant_id,
        p_quantity_change: -Number(importRecord.quantity || 0)
      });
      if (stockError) throw new DatabaseError('Failed to reverse imported stock', stockError);

      await this.deleteById(importId);
      return true;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Delete import with stock reverse failed: ${error.message}`, error);
    }
  }
}
