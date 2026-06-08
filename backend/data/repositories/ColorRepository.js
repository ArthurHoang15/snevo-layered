import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class ColorRepository extends BaseRepository {
  constructor() {
    super('colors', 'color_id');
  }

  async findActive() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('color_name', { ascending: true });
      if (error) throw new DatabaseError('Failed to find active colors', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find active colors failed: ${error.message}`, error);
    }
  }

  async findByName(colorName) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('color_name', colorName)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find color by name', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find color by name failed: ${error.message}`, error);
    }
  }
}
