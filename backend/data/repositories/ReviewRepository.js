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
      if (error) throw new DatabaseError('Failed to verify purchase', error);
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
      const { page = 1, limit = 20, orderBy = 'created_at', orderDirection = 'desc' } = options;
      const offset = (page - 1) * limit;
      const { data, error, count } = await this.db
        .from(this.tableName)
        .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
        .eq('shoe_id', shoeId)
        .order(orderBy, { ascending: orderDirection === 'asc' })
        .range(offset, offset + limit - 1);
      if (error) throw new DatabaseError('Failed to find reviews by shoe', error);
      return { data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
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
