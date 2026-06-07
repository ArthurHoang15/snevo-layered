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

  async setDefault(userId, addressId) {
    try {
      const { error: unsetError } = await this.db
        .from(this.tableName)
        .update({ is_default: false })
        .eq('user_id', userId);
      if (unsetError) throw new DatabaseError('Failed to unset default address', unsetError);

      const { data, error } = await this.db
        .from(this.tableName)
        .update({ is_default: true })
        .eq('user_id', userId)
        .eq(this.primaryKey, addressId)
        .select()
        .single();
      if (error) throw new DatabaseError('Failed to set default address', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Set default address failed: ${error.message}`, error);
    }
  }

  async createForUser(userId, addressData) {
    const address = await this.create({ ...addressData, user_id: userId });
    if (addressData.is_default) {
      return this.setDefault(userId, address.address_id);
    }
    return address;
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
      if (addressData.is_default) {
        return this.setDefault(userId, addressId);
      }
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
