import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ImportRepository extends BaseRepository {
  constructor() {
    super('imports', 'import_id');
  }

  async findAllWithDetails(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, orderBy = 'import_date', orderDirection = 'desc' } = pagination;
      const { variant_id, user_id, shoe_id, from_date, to_date } = filters;
      const offset = (page - 1) * limit;

      let query = this.db
        .from(this.tableName)
        .select(`
          import_id,
          supplier_id,
          user_id,
          variant_id,
          quantity_imported,
          import_price,
          import_date,
          notes,
          created_at,
          variant:shoe_variants!inner(
            variant_id,
            sku,
            stock_quantity,
            variant_price,
            shoe:shoes!inner(shoe_id, shoe_name, image_url),
            color:colors(color_id, color_name, hex_code),
            size:sizes(size_id, size_value, size_type)
          )
        `, { count: 'exact' });

      if (variant_id) query = query.eq('variant_id', variant_id);
      if (user_id) query = query.eq('user_id', user_id);
      if (from_date) query = query.gte('import_date', from_date);
      if (to_date) query = query.lte('import_date', to_date);
      if (shoe_id) query = query.eq('variant.shoe_id', shoe_id);

      query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      if (limit > 0) query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to fetch imports with details', error);

      let rows = data || [];
      const userIds = [...new Set(rows.map((item) => item.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await this.db
          .from('profiles')
          .select('user_id, username, full_name')
          .in('user_id', userIds);
        if (profileError) throw new DatabaseError('Failed to fetch import profiles', profileError);
        const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
        rows = rows.map((item) => ({
          ...item,
          user: profileMap.get(item.user_id) || null
        }));
      }

      return {
        data: rows,
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

  async getOrCreateDefaultSupplier() {
    try {
      const { data, error } = await this.db
        .from('suppliers')
        .select('supplier_id')
        .limit(1);
      if (error) throw new DatabaseError('Failed to fetch suppliers', error);

      if (data && data.length > 0) {
        return data[0].supplier_id;
      }

      const { data: newSupplier, error: insertError } = await this.db
        .from('suppliers')
        .insert([{ supplier_name: 'Default Supplier', is_active: true }])
        .select('supplier_id')
        .single();

      if (insertError) throw new DatabaseError('Failed to create default supplier', insertError);
      return newSupplier.supplier_id;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get or create default supplier failed: ${error.message}`, error);
    }
  }

  async batchCreate(imports, userId, notes = null) {
    try {
      const defaultSupplierId = await this.getOrCreateDefaultSupplier();

      const payload = imports.map((item) => this.cleanData({
        variant_id: item.variant_id,
        user_id: userId,
        supplier_id: item.supplier_id || defaultSupplierId,
        quantity_imported: item.quantity_imported,
        import_price: item.import_price,
        notes: item.notes ?? notes,
        import_date: item.import_date ?? new Date().toISOString()
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
      const totalQuantity = rows.reduce((sum, item) => sum + Number(item.quantity_imported || 0), 0);
      const totalCost = rows.reduce((sum, item) => {
        return sum + Number(item.quantity_imported || 0) * Number(item.import_price || 0);
      }, 0);
      return {
        total_imports: result.total,
        total_quantity: totalQuantity,
        total_cost: Number(totalCost.toFixed(2)),
        average_import_price: totalQuantity > 0 ? Number((totalCost / totalQuantity).toFixed(2)) : 0
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get import statistics failed: ${error.message}`, error);
    }
  }

}
