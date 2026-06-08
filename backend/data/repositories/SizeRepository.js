import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class SizeRepository extends BaseRepository {
  constructor() {
    super('sizes', 'size_id');
  }

  async findActive() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('size_value', { ascending: true });
      if (error) throw new DatabaseError('Failed to find active sizes', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find active sizes failed: ${error.message}`, error);
    }
  }

  async findByType(sizeType = 'US') {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('size_type', sizeType)
        .eq('is_active', true)
        .order('size_value', { ascending: true });
      if (error) throw new DatabaseError('Failed to find sizes by type', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find sizes by type failed: ${error.message}`, error);
    }
  }
}
