import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { PAYMENT_METHODS, PAYMENT_STATUS, ORDER_STATUS } from '../../infrastructure/utils/constants.js';
import {
  generateMockPaymentDetails,
  parsePaymentDetails,
  shouldAutoCompletePayment,
  validateOrderTransition
} from '../../infrastructure/utils/orderUtils.js';

function requireDependency(value, name) {
  if (!value) throw new BusinessLogicError(`${name} repository is required`);
}

function toPositiveInteger(value, field) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a positive integer` }]);
  }
  return parsed;
}

function toNonNegativeNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ValidationError('Validation failed', [{ field, message: `${field} must be a non-negative number` }]);
  }
  return parsed;
}

function enrichPayment(payment) {
  if (!payment) return payment;
  return {
    ...payment,
    payment_details: parsePaymentDetails(payment.transaction_id)
  };
}

export default class PaymentService {
  constructor({ paymentRepository, orderRepository } = {}) {
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
  }

  async getPaymentById(paymentId) {
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(paymentId, 'payment_id');
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment');
    return enrichPayment(payment);
  }

  async getLatestPaymentForOrder(orderId) {
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(orderId, 'order_id');
    const payment = await this.paymentRepository.findLatestByOrderId(id);
    if (!payment) throw new NotFoundError('Payment');
    return enrichPayment(payment);
  }

  async listPaymentsByOrder(orderId) {
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(orderId, 'order_id');
    const result = await this.paymentRepository.findByOrderId(id);
    return {
      ...result,
      data: result.data.map(enrichPayment)
    };
  }

  async createPayment(orderId, paymentData = {}) {
    requireDependency(this.paymentRepository, 'Payment');
    requireDependency(this.orderRepository, 'Order');
    const id = toPositiveInteger(orderId, 'order_id');
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError('Order');
    const paymentMethod = this._validatePaymentMethod(paymentData.payment_method);
    const paymentAmount = toNonNegativeNumber(paymentData.payment_amount ?? order.total_amount, 'payment_amount');
    const status = paymentData.status ?? (
      shouldAutoCompletePayment(paymentMethod) ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING
    );
    this._validatePaymentStatus(status);

    const payment = await this.paymentRepository.createPayment({
      order_id: id,
      payment_method: paymentMethod,
      payment_amount: paymentAmount,
      status,
      transaction_id: generateMockPaymentDetails(paymentMethod, paymentData.payment_details || paymentData)
    });
    return enrichPayment(payment);
  }

  async updatePaymentStatus(paymentId, status, transactionData = null) {
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(paymentId, 'payment_id');
    this._validatePaymentStatus(status);
    const existing = await this.paymentRepository.findById(id);
    if (!existing) throw new NotFoundError('Payment');
    const transactionId = transactionData
      ? generateMockPaymentDetails(existing.payment_method, transactionData)
      : null;
    const payment = await this.paymentRepository.updateStatus(id, status, transactionId);
    return enrichPayment(payment);
  }

  async completePayment(paymentId, transactionData = {}) {
    requireDependency(this.orderRepository, 'Order');
    const payment = await this.updatePaymentStatus(paymentId, PAYMENT_STATUS.COMPLETED, transactionData);
    if (payment && payment.order_id) {
      await this.orderRepository.setStatus(payment.order_id, ORDER_STATUS.DELIVERED);
    }
    return payment;
  }

  async failPayment(paymentId, transactionData = {}) {
    return this.updatePaymentStatus(paymentId, PAYMENT_STATUS.FAILED, transactionData);
  }

  async refundPayment(paymentId, transactionData = {}) {
    return this.updatePaymentStatus(paymentId, PAYMENT_STATUS.REFUNDED, transactionData);
  }

  async approveCod(paymentId) {
    requireDependency(this.paymentRepository, 'Payment');
    requireDependency(this.orderRepository, 'Order');
    
    const id = toPositiveInteger(paymentId, 'payment_id');
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment');
    
    if (payment.payment_method !== PAYMENT_METHODS.CASH) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'Only Cash payments can be approved via COD flow' }]);
    }
    
    const order = await this.orderRepository.findById(payment.order_id);
    if (!order) throw new NotFoundError('Order');
    
    const transition = validateOrderTransition(order, ORDER_STATUS.SUCCESS, payment);
    if (!transition.valid) throw new BusinessLogicError(transition.reason);
    
    await this.orderRepository.setStatus(order.order_id, ORDER_STATUS.SUCCESS);
    
    return enrichPayment(payment);
  }

  async collectCod(paymentId, collectorData = {}) {
    requireDependency(this.paymentRepository, 'Payment');
    requireDependency(this.orderRepository, 'Order');
    
    const id = toPositiveInteger(paymentId, 'payment_id');
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment');
    
    if (payment.payment_method !== PAYMENT_METHODS.CASH) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'Only Cash payments can be collected' }]);
    }
    
    const nowStr = new Date().toISOString();
    const transactionData = {
      s: 'collected',
      c: collectorData.username || 'Admin',
      ca: nowStr
    };
    
    const transactionId = generateMockPaymentDetails(PAYMENT_METHODS.CASH, transactionData);
    const updatedPayment = await this.paymentRepository.updateStatus(id, PAYMENT_STATUS.COMPLETED, transactionId);
    
    await this.orderRepository.setStatus(payment.order_id, ORDER_STATUS.DELIVERED);
    
    return enrichPayment(updatedPayment);
  }

  async getRevenueSummary() {
    requireDependency(this.paymentRepository, 'Payment');
    return {
      total_revenue: await this.paymentRepository.sumCompletedRevenue()
    };
  }

  _validatePaymentMethod(paymentMethod) {
    const method = typeof paymentMethod === 'string' ? paymentMethod.trim() : '';
    if (!method) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'payment_method is required' }]);
    }
    if (!Object.values(PAYMENT_METHODS).includes(method)) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'payment_method is not supported' }]);
    }
    return method;
  }

  _validatePaymentStatus(status) {
    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      throw new ValidationError('Validation failed', [{ field: 'status', message: 'status is not supported' }]);
    }
  }
}
