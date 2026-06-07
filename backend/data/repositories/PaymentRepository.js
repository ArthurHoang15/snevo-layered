import BaseRepository from './BaseRepository.js';
import { DatabaseError } from '../../infrastructure/errors/ErrorClasses.js';

export default class PaymentRepository extends BaseRepository {
  constructor() {
    super('payments', 'payment_id');
  }

  async findByOrderId(orderId) {
    return this.find({ order_id: orderId }, { orderBy: 'created_at', orderDirection: 'desc' });
  }

  async findByStatus(status) {
    return this.find({ status }, { orderBy: 'created_at', orderDirection: 'desc' });
  }

  async findByMethod(paymentMethod) {
    return this.find({ payment_method: paymentMethod }, { orderBy: 'created_at', orderDirection: 'desc' });
  }

  async updateStatus(paymentId, status, transactionId = null) {
    const updateData = { status };
    if (transactionId !== null) updateData.transaction_id = transactionId;
    return this.updateById(paymentId, updateData);
  }

  async createPayment({ order_id, payment_method, payment_amount, status = 'pending', transaction_id = null, payment_date = null }) {
    return this.create({
      order_id,
      payment_method,
      payment_amount,
      status,
      transaction_id,
      payment_date: payment_date || new Date().toISOString()
    });
  }

  async findLatestByOrderId(orderId) {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new DatabaseError('Failed to find latest payment', error);
      return data || null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Find latest payment failed: ${error.message}`, error);
    }
  }

  async sumCompletedRevenue() {
    try {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('payment_amount')
        .eq('status', 'completed');
      if (error) throw new DatabaseError('Failed to calculate total revenue', error);
      return (data || []).reduce((sum, payment) => sum + Number(payment.payment_amount || 0), 0);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(`Sum completed revenue failed: ${error.message}`, error);
    }
  }
}
