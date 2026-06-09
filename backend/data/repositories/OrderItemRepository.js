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
        .select('quantity, price_per_unit, shoe_variants(shoes(shoe_id, shoe_name, image_url, base_price))');
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
        .select('quantity, price_per_unit, shoe_variants(shoes(shoe_id, shoe_name, image_url, base_price))')
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
    let totalAllRevenue = 0;
    for (const item of items) {
      const product = item.shoe_variants?.shoes;
      if (!product) continue;
      
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price_per_unit || product.base_price || 0);
      const itemRevenue = quantity * price;
      totalAllRevenue += itemRevenue;

      const existing = productMap.get(product.shoe_id) || {
        shoe_id: product.shoe_id,
        shoe_name: product.shoe_name,
        image_url: product.image_url,
        units_sold: 0,
        revenue: 0
      };
      existing.units_sold += quantity;
      existing.revenue += itemRevenue;
      productMap.set(product.shoe_id, existing);
    }

    const result = Array.from(productMap.values())
      .sort((a, b) => b.units_sold - a.units_sold)
      .slice(0, limit);

    return result.map(p => ({
      ...p,
      percentage_of_revenue: totalAllRevenue > 0 ? Math.round((p.revenue / totalAllRevenue) * 100) : 0
    }));
  }
}
