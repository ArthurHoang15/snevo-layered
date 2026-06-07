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

  _normalizeArrayFilter(value) {
    if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null && item !== '');
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  _deduplicateShoes(shoes) {
    const shoeMap = new Map();
    for (const shoe of shoes || []) {
      if (!shoeMap.has(shoe.shoe_id)) {
        shoeMap.set(shoe.shoe_id, { ...shoe, shoe_variants: [] });
      }

      const existingShoe = shoeMap.get(shoe.shoe_id);
      if (Array.isArray(shoe.shoe_variants)) {
        existingShoe.shoe_variants.push(...shoe.shoe_variants);
      }
    }

    return Array.from(shoeMap.values()).map((shoe) => {
      const uniqueVariants = Array.from(
        new Map((shoe.shoe_variants || []).map((variant) => [variant.variant_id, variant])).values()
      );
      const activeVariants = uniqueVariants.filter((variant) => variant?.is_active === true);
      const totalStock = activeVariants.reduce((sum, variant) => sum + Number(variant.stock_quantity || 0), 0);
      const availableColors = [
        ...new Map(
          activeVariants
            .filter((variant) => variant.colors)
            .map((variant) => [variant.colors.color_id, variant.colors])
        ).values()
      ];
      const availableSizes = [
        ...new Map(
          activeVariants
            .filter((variant) => variant.sizes)
            .map((variant) => [variant.sizes.size_id, variant.sizes])
        ).values()
      ].sort((a, b) => Number.parseFloat(a.size_value) - Number.parseFloat(b.size_value));

      return {
        ...shoe,
        shoe_variants: uniqueVariants,
        stock_info: {
          total_stock: totalStock,
          has_stock: totalStock > 0,
          variant_count: activeVariants.length,
          available_colors: availableColors,
          available_sizes: availableSizes
        }
      };
    });
  }

  async findAllWithFilters(filters = {}, pagination = {}, sortBy = 'created_at', sortOrder = 'desc') {
    try {
      const {
        category_id,
        min_price,
        max_price,
        search,
        color_ids,
        size_ids,
        is_active = true,
        include_no_variants = false
      } = filters;
      const page = Number.parseInt(pagination.page ?? 1, 10);
      const limit = Number.parseInt(pagination.limit ?? 20, 10);
      const offset = (page - 1) * limit;
      const joinType = include_no_variants ? '' : '!inner';

      let query = this.db
        .from(this.tableName)
        .select(`
          *,
          categories (
            category_id,
            category_name,
            description,
            image_url
          ),
          shoe_variants${joinType} (
            variant_id,
            color_id,
            size_id,
            stock_quantity,
            variant_price,
            sku,
            is_active,
            colors (
              color_id,
              color_name,
              hex_code
            ),
            sizes (
              size_id,
              size_value,
              size_type
            )
          )
        `, { count: 'exact' });

      if (is_active !== undefined) query = query.eq('is_active', is_active);
      if (category_id) query = query.eq('category_id', category_id);
      if (min_price) query = query.gte('base_price', min_price);
      if (max_price) query = query.lte('base_price', max_price);
      if (search) query = query.or(`shoe_name.ilike.%${search}%,description.ilike.%${search}%`);

      if (!include_no_variants) {
        const colorIds = this._normalizeArrayFilter(color_ids);
        const sizeIds = this._normalizeArrayFilter(size_ids);
        if (colorIds.length > 0) query = query.in('shoe_variants.color_id', colorIds);
        if (sizeIds.length > 0) query = query.in('shoe_variants.size_id', sizeIds);
        query = query.gt('shoe_variants.stock_quantity', 0);
        query = query.eq('shoe_variants.is_active', true);
      }

      query = query.order(this._mapSortColumn(sortBy), { ascending: sortOrder === 'asc' });

      const { data, error } = await query;
      if (error) throw new DatabaseError('Failed to find shoes with filters', error);
      const uniqueShoes = this.hideFields(this._deduplicateShoes(data || []));
      const paginatedShoes = limit > 0 ? uniqueShoes.slice(offset, offset + limit) : uniqueShoes;

      return {
        data: paginatedShoes,
        pagination: {
          page,
          limit,
          total: uniqueShoes.length,
          totalPages: limit > 0 ? Math.ceil(uniqueShoes.length / limit) : 1
        }
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
      if (!data) return null;
      const variants = data.shoe_variants || [];
      const totalStock = variants.reduce((sum, variant) => sum + Number(variant.stock_quantity || 0), 0);
      return this.hideFields({
        ...data,
        stock_info: {
          total_stock: totalStock,
          has_stock: totalStock > 0,
          variant_count: variants.length
        }
      });
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
    try {
      const { count: activeVariantsCount, error: countError } = await this.db
        .from('shoe_variants')
        .select('*', { count: 'exact', head: true })
        .eq('shoe_id', shoeId)
        .eq('is_active', true);
      if (countError) throw new DatabaseError('Failed to count active variants before soft delete', countError);

      const shoe = await super.softDelete(shoeId);

      const { count: remainingActiveVariants, error: verifyError } = await this.db
        .from('shoe_variants')
        .select('*', { count: 'exact', head: true })
        .eq('shoe_id', shoeId)
        .eq('is_active', true);
      if (verifyError) throw new DatabaseError('Failed to verify soft delete cascade', verifyError);

      return {
        ...shoe,
        variants_cascade_deleted: Math.max(0, Number(activeVariantsCount || 0) - Number(remainingActiveVariants || 0)),
        total_variants_before: activeVariantsCount || 0,
        remaining_active_variants: remainingActiveVariants || 0
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Soft delete shoe failed: ${error.message}`, error);
    }
  }

  async restore(shoeId) {
    try {
      const preview = await this.getRestorePreview(shoeId);
      if (!preview.can_restore) {
        throw new DatabaseError('Cannot restore shoe: ' + preview.reason);
      }

      const shoe = await super.restore(shoeId);
      return {
        ...shoe,
        variants_restored: preview.will_restore.length,
        variants_skipped: preview.will_skip.length,
        skipped_reasons: preview.will_skip.map((variant) => ({
          variant_id: variant.variant_id,
          sku: variant.sku,
          reason: variant.skip_reason
        }))
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Restore shoe failed: ${error.message}`, error);
    }
  }

  async getRestorePreview(shoeId) {
    try {
      const { data: shoe, error: shoeError } = await this.db
        .from(this.tableName)
        .select('*')
        .eq(this.primaryKey, shoeId)
        .single();
      if (shoeError) throw new DatabaseError('Failed to find shoe for restore preview', shoeError);
      if (shoe?.is_active) {
        return {
          can_restore: false,
          reason: 'Shoe is already active',
          will_restore: [],
          will_skip: []
        };
      }

      const { data: deletedVariants, error } = await this.db
        .from('shoe_variants')
        .select('*, colors(color_id, color_name, hex_code), sizes(size_id, size_value, size_type)')
        .eq('shoe_id', shoeId)
        .eq('is_active', false)
        .not('deleted_at', 'is', null);
      if (error) throw new DatabaseError('Failed to get restore preview', error);

      const will_restore = [];
      const will_skip = [];
      for (const variant of deletedVariants || []) {
        if (shoe.deleted_at && variant.deleted_at && new Date(variant.deleted_at) < new Date(shoe.deleted_at)) {
          will_skip.push({ ...variant, skip_reason: 'Deleted independently before shoe deletion' });
        } else {
          will_restore.push(variant);
        }
      }

      return {
        can_restore: true,
        shoe,
        will_restore,
        will_skip,
        deleted_variants: deletedVariants || [],
        summary: {
          total_deleted_variants: (deletedVariants || []).length,
          will_restore_count: will_restore.length,
          will_skip_count: will_skip.length
        }
      };
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
      const amount = Number(quantity || 0);
      const next = operation === 'increment' || operation === 'add'
        ? current + amount
        : operation === 'decrement' || operation === 'subtract'
          ? Math.max(0, current - amount)
          : amount;
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
      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
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
      const totalReviews = reviews.length;
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const review of reviews) {
        ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
      }
      const average = totalReviews
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews
        : 0;
      return {
        average_rating: Math.round(average * 10) / 10,
        total_reviews: totalReviews,
        rating_distribution: ratingDistribution
      };
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
        .select('*, profiles(full_name, avatar_url)')
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
