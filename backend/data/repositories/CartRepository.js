import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class CartRepository extends BaseRepository {
  constructor() {
    super('carts', 'cart_id');
  }

  async listByUser(userId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select(`
          *,
          shoe_variants (
            variant_id,
            sku,
            stock_quantity,
            shoes ( shoe_id, shoe_name, image_url, base_price ),
            colors ( color_id, color_name, hex_code ),
            sizes ( size_id, size_value, size_type )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new DatabaseError('Failed to list cart items', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`List cart items failed: ${error.message}`, error);
    }
  }

  async findByUserAndVariant(userId, variantId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('variant_id', variantId)
        .maybeSingle();

      if (error) throw new DatabaseError('Failed to query cart item', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find cart item failed: ${error.message}`, error);
    }
  }

  async addOrUpdate(userId, variantId, quantity, priceAtAdd) {
    try {
      const existing = await this.findByUserAndVariant(userId, variantId);
      if (existing) {
        return this.updateItem(existing.cart_id, {
          quantity: Number(existing.quantity || 0) + Number(quantity || 0),
          price_at_add: priceAtAdd
        });
      }

      const { data, error } = await this.db
        .from(this.tableName)
        .insert([{
          user_id: userId,
          variant_id: variantId,
          quantity,
          price_at_add: priceAtAdd
        }])
        .select()
        .single();

      if (error) throw new DatabaseError('Failed to add to cart', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Add or update cart item failed: ${error.message}`, error);
    }
  }

  async updateItem(cartId, { quantity, variant_id, price_at_add }) {
    try {
      const updateData = {};
      if (typeof quantity === 'number') updateData.quantity = quantity;
      if (typeof variant_id === 'number') updateData.variant_id = variant_id;
      if (typeof price_at_add === 'number') updateData.price_at_add = price_at_add;

      const { data, error } = await this.db
        .from(this.tableName)
        .update(updateData)
        .eq(this.primaryKey, cartId)
        .select()
        .single();

      if (error) throw new DatabaseError('Failed to update cart item', error);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Update cart item failed: ${error.message}`, error);
    }
  }

  async removeItem(cartId) {
    return this.deleteById(cartId);
  }

  async clearUserCart(userId) {
    try {
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('user_id', userId);

      if (error) throw new DatabaseError('Failed to clear cart', error);
      return true;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Clear cart failed: ${error.message}`, error);
    }
  }
}
