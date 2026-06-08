import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class AddressRepository extends BaseRepository {
  constructor() {
    super('addresses', 'address_id');
  }

  async findByUserId(userId) {
    const result = await this.find({ user_id: userId }, { orderBy: 'created_at', orderDirection: 'desc' });
    return result.data;
  }

  async findOne(filters) {
    try {
      let query = this.db.from(this.tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw new DatabaseError('Failed to find address', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find address failed: ${error.message}`, error);
    }
  }

  async findDefaultByUserId(userId) {
    return this.findOne({ user_id: userId, is_default: true });
  }

  async clearDefaultForUser(userId) {
    try {
      const { error } = await this.db
        .from(this.tableName)
        .update({ is_default: false })
        .eq('user_id', userId);
      if (error) throw new DatabaseError('Failed to clear default addresses', error);
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Clear default addresses failed: ${error.message}`, error);
    }
  }

  async updateDefaultFlag(addressId, isDefault) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .update({ is_default: isDefault })
        .eq(this.primaryKey, addressId)
        .select()
        .single();
      if (error) throw new DatabaseError('Failed to update address default flag', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update address default flag failed: ${error.message}`, error);
    }
  }

  async createForUser(userId, addressData) {
    return this.create({ ...addressData, user_id: userId });
  }

  async updateForUser(userId, addressId, addressData) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .update(this.cleanData(addressData))
        .eq('user_id', userId)
        .eq(this.primaryKey, addressId)
        .select()
        .single();
      if (error) throw new DatabaseError('Failed to update user address', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update user address failed: ${error.message}`, error);
    }
  }

  async deleteForUser(userId, addressId) {
    try {
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('user_id', userId)
        .eq(this.primaryKey, addressId);
      if (error) throw new DatabaseError('Failed to delete user address', error);
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Delete user address failed: ${error.message}`, error);
    }
  }
}
