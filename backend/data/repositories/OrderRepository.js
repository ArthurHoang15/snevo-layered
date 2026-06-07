import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';
import { parsePaymentDetails } from '../../infrastructure/utils/orderUtils.js';

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
      const currentPage = Number.parseInt(page, 10);
      const pageLimit = Number.parseInt(limit, 10);
      const offset = (currentPage - 1) * pageLimit;
      let query = this.db
        .from(this.tableName)
        .select(`
          order_id,
          user_id,
          address_id,
          total_amount,
          shipping_cost,
          tax_amount,
          status,
          notes,
          created_at,
          updated_at,
          order_items(order_item_id)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      if (search) query = query.ilike('order_id', `%${search}%`);
      query = query.range(offset, offset + pageLimit - 1);
      const { data, error, count } = await query;
      if (error) throw new DatabaseError('Failed to find all orders', error);

      let ordersWithProfiles = data || [];
      const userIds = [...new Set(ordersWithProfiles.map((order) => order.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await this.db
          .from('profiles')
          .select('user_id, username, email')
          .in('user_id', userIds);
        if (profileError) throw new DatabaseError('Failed to fetch order profiles', profileError);

        const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
        ordersWithProfiles = ordersWithProfiles.map((order) => ({
          ...order,
          profiles: profileMap.get(order.user_id) || null
        }));
      }

      const total = count || 0;
      const pages = Math.ceil(total / pageLimit);
      return {
        data: ordersWithProfiles,
        orders: ordersWithProfiles,
        total,
        page: currentPage,
        limit: pageLimit,
        pages: pages,
        totalPages: pages
      };
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
            order_item_id,
            variant_id,
            quantity,
            price_per_unit,
            shoe_variants (
              shoe_id,
              shoes (
                shoe_name,
                image_url
              ),
              colors (
                color_id,
                color_name
              ),
              sizes (
                size_id,
                size_value
              )
            )
          ),
          payments (
            payment_id,
            payment_method,
            payment_amount,
            status,
            transaction_id,
            payment_date
          )
        `)
        .eq(this.primaryKey, orderId)
        .single();
      if (error && error.code !== 'PGRST116') throw new DatabaseError('Failed to find order with items', error);
      if (!data) return null;

      if (data.address_id) {
        const { data: address, error: addressError } = await this.db
          .from('addresses')
          .select('*')
          .eq('address_id', data.address_id)
          .single();
        if (addressError && addressError.code !== 'PGRST116') {
          throw new DatabaseError('Failed to find order address', addressError);
        }
        if (address) data.address = address;
      }

      if (Array.isArray(data.payments) && data.payments.length > 0) {
        data.payments = data.payments.map((payment) => ({
          ...payment,
          details: parsePaymentDetails(payment.transaction_id)
        }));
        data.payment = data.payments[0];
      }

      return data;
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
      return {
        ...order,
        payment: payment
          ? {
              ...payment,
              details: parsePaymentDetails(payment.transaction_id)
            }
          : null
      };
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
