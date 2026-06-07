import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ShoeRepository extends BaseRepository {
  constructor() {
    super('shoes', 'shoe_id');
  }

  _mapSortColumn(sortBy) {
    const sortMap = {
      name: 'shoe_name',
      price: 'base_price',
      created: 'created_at',
      updated: 'updated_at'
    };
    return sortMap[sortBy] || sortBy || 'created_at';
  }

  _deduplicateShoes(shoes) {
    const shoeMap = new Map();
    for (const shoe of shoes || []) {
      if (!shoeMap.has(shoe.shoe_id)) {
        shoeMap.set(shoe.shoe_id, { ...shoe });
      }
    }
    return Array.from(shoeMap.values());
  }

  async findAllWithFilters(filters = {}, pagination = {}, sortBy = 'created_at', sortOrder = 'desc') {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      let query = this.db
        .from(this.tableName)
        .select('*, categories(*), shoe_variants(*, colors(*), sizes(*))', { count: 'exact' });

      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        if (key === 'search') {
          query = query.or(`shoe_name.ilike.%${value}%,description.ilike.%${value}%`);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      query = query.order(this._mapSortColumn(sortBy), { ascending: sortOrder === 'asc' });
      if (limit > 0) query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to find shoes with filters', error);

      return {
        data: this.hideFields(this._deduplicateShoes(data || [])),
        total: count || 0,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil((count || 0) / limit) : 1
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find shoes with filters failed: ${error.message}`, error);
    }
  }

  async findByIdWithDetails(shoeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, categories(*), shoe_variants(*, colors(*), sizes(*))')
        .eq(this.primaryKey, shoeId)
        .single();
      if (error && error.code !== 'PGRST116') throw new DatabaseError('Failed to find shoe details', error);
      return data ? this.hideFields(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find shoe details failed: ${error.message}`, error);
    }
  }

  async findActive(pagination = {}) {
    return this.findAllWithFilters({ is_active: true }, pagination);
  }

  async search(searchTerm, filters = {}, pagination = {}) {
    return this.findAllWithFilters({ ...filters, search: searchTerm, is_active: true }, pagination);
  }

  async findByCategory(categoryId, filters = {}, pagination = {}) {
    return this.findAllWithFilters({ ...filters, category_id: categoryId, is_active: true }, pagination);
  }

  async getFeatured(limit = 10) {
    const result = await this.findAllWithFilters({ is_active: true, is_featured: true }, { page: 1, limit });
    return result.data;
  }

  async countAll() {
    return this.count();
  }

  async softDelete(shoeId) {
    return super.softDelete(shoeId);
  }

  async restore(shoeId) {
    return super.restore(shoeId);
  }

  async getRestorePreview(shoeId) {
    try {
      const shoe = await this.findById(shoeId);
      const { data: deletedVariants, error } = await this.db
        .from('shoe_variants')
        .select('*, colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('shoe_id', shoeId)
        .eq('is_active', false);
      if (error) throw new DatabaseError('Failed to get restore preview', error);
      return { shoe, deleted_variants: deletedVariants || [] };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get restore preview failed: ${error.message}`, error);
    }
  }

  async getVariants(productId) {
    try {
      const { data, error } = await this.db
        .from('shoe_variants')
        .select('*, colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('shoe_id', productId)
        .eq('is_active', true);
      if (error) throw new DatabaseError('Failed to get variants', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get variants failed: ${error.message}`, error);
    }
  }

  async updateStock(variantId, quantity, operation = 'set') {
    try {
      const { data: variant, error: findError } = await this.db
        .from('shoe_variants')
        .select('stock_quantity')
        .eq('variant_id', variantId)
        .single();
      if (findError) throw new DatabaseError('Failed to find variant stock', findError);

      const current = Number(variant.stock_quantity || 0);
      const next = operation === 'increment' ? current + quantity : operation === 'decrement' ? current - quantity : quantity;
      const { data, error } = await this.db
        .from('shoe_variants')
        .update({ stock_quantity: next })
        .eq('variant_id', variantId)
        .select()
        .single();
      if (error) throw new DatabaseError('Failed to update stock', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update stock failed: ${error.message}`, error);
    }
  }

  async getReviews(productId, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      const { data, error, count } = await this.db
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
        .eq('shoe_id', productId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new DatabaseError('Failed to get reviews', error);
      return { data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get reviews failed: ${error.message}`, error);
    }
  }

  async getRatingSummary(productId) {
    try {
      const { data, error } = await this.db
        .from('reviews')
        .select('rating')
        .eq('shoe_id', productId);
      if (error) throw new DatabaseError('Failed to get rating summary', error);
      const reviews = data || [];
      const count = reviews.length;
      const average = count ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count : 0;
      return { average_rating: average, review_count: count };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get rating summary failed: ${error.message}`, error);
    }
  }

  async createReview(reviewData) {
    try {
      const { data, error } = await this.db
        .from('reviews')
        .insert([this.cleanData(reviewData)])
        .select()
        .single();
      if (error) throw new DatabaseError('Failed to create review', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Create review failed: ${error.message}`, error);
    }
  }

  async getRelatedProducts(productId, limit = 4) {
    try {
      const product = await this.findById(productId);
      if (!product) return [];
      const result = await this.findAllWithFilters(
        { category_id: product.category_id, is_active: true },
        { page: 1, limit: limit + 1 }
      );
      return result.data.filter((item) => item.shoe_id !== productId).slice(0, limit);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get related products failed: ${error.message}`, error);
    }
  }
}
