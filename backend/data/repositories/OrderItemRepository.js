import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class OrderItemRepository extends BaseRepository {
  constructor() {
    super('order_items', 'order_item_id');
  }

  async findByOrderId(orderId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*, shoe_variants(*, shoes(*), colors(*), sizes(*))')
        .eq('order_id', orderId);
      if (error) throw new DatabaseError('Failed to find order items', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find order items failed: ${error.message}`, error);
    }
  }

  async findByVariantId(variantId) {
    return this.find({ variant_id: variantId });
  }

  async insertItems(orderId, items) {
    try {
      const payload = items.map((item) => this.cleanData({
        order_id: orderId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit ?? item.price_at_add
      }));
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(payload)
        .select();
      if (error) throw new DatabaseError('Failed to insert order items', error);
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Insert order items failed: ${error.message}`, error);
    }
  }

  async getTopSellingProducts(limit = 5) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('quantity, shoe_variants(shoes(shoe_id, shoe_name, image_url))');
      if (error) throw new DatabaseError('Failed to get top selling products', error);
      return this._aggregateTopProducts(data || [], limit);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get top selling products failed: ${error.message}`, error);
    }
  }

  async getTopSellingProductsSince(startDate, limit = 5) {
    try {
      const { data: orders, error: orderError } = await this.db
        .from('orders')
        .select('order_id')
        .gte('created_at', startDate);
      if (orderError) throw new DatabaseError('Failed to find recent orders', orderError);
      const orderIds = (orders || []).map((order) => order.order_id);
      if (orderIds.length === 0) return [];
      const { data, error } = await this.db
        .from(this.tableName)
        .select('quantity, shoe_variants(shoes(shoe_id, shoe_name, image_url))')
        .in('order_id', orderIds);
      if (error) throw new DatabaseError('Failed to get top selling products since date', error);
      return this._aggregateTopProducts(data || [], limit);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get top selling products since date failed: ${error.message}`, error);
    }
  }

  _aggregateTopProducts(items, limit) {
    const productMap = new Map();
    for (const item of items) {
      const product = item.shoe_variants?.shoes;
      if (!product) continue;
      const existing = productMap.get(product.shoe_id) || { ...product, total_sold: 0 };
      existing.total_sold += Number(item.quantity || 0);
      productMap.set(product.shoe_id, existing);
    }
    return Array.from(productMap.values())
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit);
  }
}
