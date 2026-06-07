import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories', 'category_id');
  }

  async findActive() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('category_name', { ascending: true });
      if (error) throw new DatabaseError('Failed to find active categories', error);
      return this.hideFields(data || []);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find active categories failed: ${error.message}`, error);
    }
  }

  async findWithProducts(categoryId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoes(*)')
        .eq(this.primaryKey, categoryId)
        .single();
      if (error && error.code !== 'PGRST116') throw new DatabaseError('Failed to find category with products', error);
      return data ? this.hideFields(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find category with products failed: ${error.message}`, error);
    }
  }

  async findWithProductCount() {
    try {
      const { data: categories, error } = await this.db
        .from(this.tableName)
        .select('*')
        .order('category_name', { ascending: true });
      if (error) throw new DatabaseError('Failed to find categories', error);

      const result = await Promise.all((categories || []).map(async (category) => {
        const { count, error: countError } = await this.db
          .from('shoes')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.category_id);
        if (countError) throw new DatabaseError('Failed to count category products', countError);
        return { ...category, product_count: count || 0 };
      }));

      return this.hideFields(result);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find categories with product count failed: ${error.message}`, error);
    }
  }

  async countAll() {
    return this.count();
  }

  async checkActiveShoesCount(categoryId) {
    try {
      const { count, error } = await this.db
        .from('shoes')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_active', true);
      if (error) throw new DatabaseError('Failed to count active shoes', error);
      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Check active shoes count failed: ${error.message}`, error);
    }
  }

  async validateUniqueName(categoryName, excludeCategoryId = null) {
    try {
      let query = this.db
        .from(this.tableName)
        .select('category_id')
        .eq('category_name', categoryName);
      if (excludeCategoryId) query = query.neq('category_id', excludeCategoryId);
      const { data, error } = await query.maybeSingle();
      if (error) throw new DatabaseError('Failed to check category name uniqueness', error);
      return !data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Validate unique category name failed: ${error.message}`, error);
    }
  }
}
