import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ReviewRepository extends BaseRepository {
  constructor() {
    super('reviews', 'review_id');
  }

  async findPurchasedOrderItems(userId, shoeId, statuses = []) {
    try {
      let query = this.db
        .from('order_items')
        .select('order_id, shoe_variants!inner(shoe_id), orders!inner(user_id, status)')
        .eq('shoe_variants.shoe_id', shoeId)
        .eq('orders.user_id', userId);
      if (statuses.length > 0) {
        query = query.in('orders.status', statuses);
      }
      const { data, error } = await query;
      if (error) throw new DatabaseError('Failed to find purchased order items', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find purchased order items failed: ${error.message}`, error);
    }
  }

  async findByUserAndShoe(userId, shoeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('shoe_id', shoeId)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find review by user and shoe', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find review by user and shoe failed: ${error.message}`, error);
    }
  }

  async findUserReviewForProduct(userId, shoeId) {
    return this.findByUserAndShoe(userId, shoeId);
  }

  async findByShoeId(shoeId, options = {}) {
    try {
      const { page = 1, limit = 20, orderBy = 'review_date', orderDirection = 'desc' } = options;
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await this.db
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('shoe_id', shoeId)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1);
      if (error) throw new DatabaseError('Failed to find reviews by shoe', error);

      let rows = data || [];
      const userIds = [...new Set(rows.map((item) => item.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await this.db
          .from('profiles')
          .select('user_id, username, full_name, avatar_url')
          .in('user_id', userIds);
        if (profileError) throw new DatabaseError('Failed to fetch review profiles', profileError);
        
        const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
        rows = rows.map((item) => {
          const profile = profileMap.get(item.user_id);
          return {
            ...item,
            username: profile?.full_name || profile?.username || 'User',
            avatar_url: profile?.avatar_url || null,
            profiles: profile || null
          };
        });
      }

      return { data: rows, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find reviews by shoe failed: ${error.message}`, error);
    }
  }

  async findByUserId(userId, options = {}) {
    return this.find({ user_id: userId }, options);
  }

  async getAverageRating(shoeId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('rating')
        .eq('shoe_id', shoeId);
      if (error) throw new DatabaseError('Failed to get average rating', error);
      const reviews = data || [];
      if (reviews.length === 0) return 0;
      return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get average rating failed: ${error.message}`, error);
    }
  }

  async getReviewCount(shoeId) {
    return this.count({ shoe_id: shoeId });
  }

  async getReviewStats(shoeId) {
    const averageRating = await this.getAverageRating(shoeId);
    const reviewCount = await this.getReviewCount(shoeId);
    return { average_rating: averageRating, review_count: reviewCount };
  }
}
