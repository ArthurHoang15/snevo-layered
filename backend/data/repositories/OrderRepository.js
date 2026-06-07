import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class OrderRepository extends BaseRepository {
  constructor() {
    super('orders', 'order_id');
  }

  async findByUserId(userId, status = null, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      let query = this.db
        .from(this.tableName)
        .select('*, order_items(*, shoe_variants(*, shoes(*)))', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      query = query.range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to find orders by user', error);
      return { data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find orders by user failed: ${error.message}`, error);
    }
  }

  async findByStatus(status) {
    return this.find({ status }, { orderBy: 'created_at', orderDirection: 'desc' });
  }

  async getAllOrders(status = null, page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      let query = this.db
        .from(this.tableName)
        .select('*, order_items(order_item_id), payments(*)', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      if (search) query = query.or(`order_id.ilike.%${search}%,user_id.ilike.%${search}%`);
      query = query.range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to find all orders', error);
      return { data: data || [], total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get all orders failed: ${error.message}`, error);
    }
  }

  async findWithItems(orderId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select(`
          *,
          order_items (
            *,
            shoe_variants (
              *,
              shoes (*),
              colors (*),
              sizes (*)
            )
          ),
          payments (*)
        `)
        .eq(this.primaryKey, orderId)
        .single();
      if (error && error.code !== 'PGRST116') throw new DatabaseError('Failed to find order with items', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find order with items failed: ${error.message}`, error);
    }
  }

  async getWithPayment(orderId) {
    try {
      const order = await this.findById(orderId);
      if (!order) return null;
      const { data: payment, error } = await this.db
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find order payment', error);
      return { ...order, payment };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Get order with payment failed: ${error.message}`, error);
    }
  }

  async setStatus(orderId, status) {
    return this.updateById(orderId, { status });
  }

  async updateStatus(orderId, status) {
    return this.setStatus(orderId, status);
  }

  async calculateTotal(orderId) {
    try {
      const { data, error } = await this.db
        .from('order_items')
        .select('quantity, unit_price')
        .eq('order_id', orderId);
      if (error) throw new DatabaseError('Failed to calculate order total', error);
      return (data || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Calculate order total failed: ${error.message}`, error);
    }
  }

  async createOrder({ user_id, address_id, total_amount, shipping_cost = 0, tax_amount = 0, notes = null }) {
    return this.create({ user_id, address_id, total_amount, shipping_cost, tax_amount, notes, status: 'pending' });
  }

  async countAll() {
    return this.count();
  }

  async countPending() {
    return this.count({ status: 'pending' });
  }

  async countApproved() {
    return this.count({ status: 'processing' });
  }

  async countCancelled() {
    return this.count({ status: 'cancelled' });
  }

  async getRecent(limit = 5) {
    const result = await this.find({}, { page: 1, limit, orderBy: 'created_at', orderDirection: 'desc' });
    return result.data;
  }
}
