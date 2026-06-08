import supabaseConfig from '../../infrastructure/database/supabase.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class BaseRepository {
  constructor(tableName, primaryKey = 'id') {
    if (this.constructor === BaseRepository) {
      throw new Error('BaseRepository is an abstract class and cannot be instantiated directly');
    }

    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.hidden = ['password_hash', 'password'];
  }

  get db() {
    return supabaseConfig.getAdminClient();
  }

  getQualifiedTableName() {
    return this.tableName;
  }

  hideFields(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.hideFields(item));
    }

    const cleaned = { ...data };
    for (const field of this.hidden) {
      delete cleaned[field];
    }
    return cleaned;
  }

  cleanData(data) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );
  }

  async create(data) {
    try {
      const { data: result, error } = await this.db
        .from(this.getQualifiedTableName())
        .insert([this.cleanData(data)])
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to create record: ${error.message}`, error);
      }

      return this.hideFields(result);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Create operation failed: ${error.message}`, error);
    }
  }

  async findById(id) {
    try {
      const { data, error } = await this.db
        .from(this.getQualifiedTableName())
        .select('*')
        .eq(this.primaryKey, id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to find record: ${error.message}`, error);
      }

      return data ? this.hideFields(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find operation failed: ${error.message}`, error);
    }
  }

  async find(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20, orderBy, orderDirection = 'desc' } = options;
      const offset = (page - 1) * limit;

      let query = this.db
        .from(this.getQualifiedTableName())
        .select('*', { count: 'exact' });

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      if (orderBy) {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      }

      if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(`Failed to find records: ${error.message}`, error);
      }

      return {
        data: this.hideFields(data || []),
        total: count || 0,
        page,
        limit,
        totalPages: limit > 0 ? Math.ceil((count || 0) / limit) : 1
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find operation failed: ${error.message}`, error);
    }
  }

  async updateById(id, data) {
    try {
      const { data: result, error } = await this.db
        .from(this.getQualifiedTableName())
        .update(this.cleanData(data))
        .eq(this.primaryKey, id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update record: ${error.message}`, error);
      }

      return this.hideFields(result);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update operation failed: ${error.message}`, error);
    }
  }

  async deleteById(id) {
    try {
      const { error } = await this.db
        .from(this.getQualifiedTableName())
        .delete()
        .eq(this.primaryKey, id);

      if (error) {
        throw new DatabaseError(`Failed to delete record: ${error.message}`, error);
      }

      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Delete operation failed: ${error.message}`, error);
    }
  }

  async softDelete(id) {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new DatabaseError('Record not found', { code: 'NOT_FOUND', details: { [this.primaryKey]: id } });
      }

      const { data, error } = await this.db
        .from(this.getQualifiedTableName())
        .update({ is_active: false })
        .eq(this.primaryKey, id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to soft delete record: ${error.message}`, error);
      }

      return this.hideFields(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Soft delete operation failed: ${error.message}`, error);
    }
  }

  async restore(id) {
    try {
      const { data, error } = await this.db
        .from(this.getQualifiedTableName())
        .update({ is_active: true })
        .eq(this.primaryKey, id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to restore record: ${error.message}`, error);
      }

      return this.hideFields(data);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Restore operation failed: ${error.message}`, error);
    }
  }

  async count(filters = {}) {
    try {
      let query = this.db
        .from(this.getQualifiedTableName())
        .select('*', { count: 'exact', head: true });

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to count records: ${error.message}`, error);
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Count operation failed: ${error.message}`, error);
    }
  }

  async rawQuery(query, params = []) {
    try {
      const { data, error } = await this.db.rpc(query, params);

      if (error) {
        throw new DatabaseError(`Raw query failed: ${error.message}`, error);
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Raw query execution failed: ${error.message}`, error);
    }
  }
}
