import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../infrastructure/utils/constants.js';
import { validateOrderTransition, parsePaymentDetails } from '../../infrastructure/utils/orderUtils.js';

function enrichOrderPayment(order) {
  if (!order) return order;
  if (order.payment) {
    const parsed = parsePaymentDetails(order.payment.transaction_id);
    order.payment.payment_details = parsed;
    order.payment.details = parsed;
  }
  if (Array.isArray(order.payments)) {
    order.payments = order.payments.map(p => {
      const parsed = parsePaymentDetails(p.transaction_id);
      return {
        ...p,
        payment_details: parsed,
        details: parsed
      };
    });
  }
  return order;
}

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

export default class AdminService {
  constructor({
    productRepository,
    categoryRepository,
    orderRepository,
    orderItemRepository,
    paymentRepository,
    variantRepository
  } = {}) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.paymentRepository = paymentRepository;
    this.variantRepository = variantRepository;
  }

  async getDashboardSummary() {
    requireDependency(this.productRepository, 'Product');
    requireDependency(this.categoryRepository, 'Category');
    requireDependency(this.orderRepository, 'Order');
    requireDependency(this.paymentRepository, 'Payment');
    requireDependency(this.variantRepository, 'Variant');
    requireDependency(this.orderItemRepository, 'OrderItem');

    const [
      productCount,
      categoryCount,
      orderCount,
      pendingOrderCount,
      approvedOrderCount,
      cancelledOrderCount,
      lowStockCount,
      totalRevenue,
      recentOrders,
      variantCount,
      topProducts
    ] = await Promise.all([
      this.productRepository.countAll ? this.productRepository.countAll() : this.productRepository.count(),
      this.categoryRepository.countAll ? this.categoryRepository.countAll() : this.categoryRepository.count(),
      this.orderRepository.countAll(),
      this.orderRepository.countPending(),
      this.orderRepository.countApproved(),
      this.orderRepository.countCancelled(),
      this.variantRepository.getLowStockCount(),
      this.paymentRepository.sumCompletedRevenue(),
      this.orderRepository.getRecent(5),
      this.variantRepository.count(),
      this.orderItemRepository.getTopSellingProducts(5)
    ]);

    return {
      products: productCount,
      categories: categoryCount,
      orders: {
        total: orderCount,
        pending: pendingOrderCount,
        approved: approvedOrderCount,
        cancelled: cancelledOrderCount
      },
      inventory: {
        low_stock: lowStockCount
      },
      payments: {
        completed_revenue: totalRevenue
      },
      recent_orders: recentOrders,
      totalMetrics: {
        totalShoes: productCount,
        totalVariants: variantCount,
        totalOrders: orderCount,
        totalRevenue: totalRevenue,
        lowStockItems: lowStockCount,
        pendingOrders: pendingOrderCount,
        approvedOrders: approvedOrderCount,
        cancelledOrders: cancelledOrderCount
      },
      topSelling: {
        products: topProducts
      }
    };
  }

  async listOrders({ status = null, page = 1, limit = 10, search = '' } = {}) {
    requireDependency(this.orderRepository, 'Order');
    const result = await this.orderRepository.getAllOrders(status, page, limit, search);
    if (result && Array.isArray(result.data)) {
      result.data = result.data.map(enrichOrderPayment);
    }
    if (result && Array.isArray(result.orders)) {
      result.orders = result.orders.map(enrichOrderPayment);
    }
    return result;
  }

  async getOrderDetail(orderId) {
    requireDependency(this.orderRepository, 'Order');
    const id = toPositiveInteger(orderId, 'order_id');
    const order = await this.orderRepository.findWithItems(id);
    if (!order) throw new NotFoundError('Order');
    return enrichOrderPayment(order);
  }

  async updateOrderStatus(orderId, status) {
    requireDependency(this.orderRepository, 'Order');
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(orderId, 'order_id');
    this._validateStatus(status);
    const order = await this.orderRepository.getWithPayment(id);
    if (!order) throw new NotFoundError('Order');
    const transition = validateOrderTransition(order, status, order.payment);
    if (!transition.valid) throw new BusinessLogicError(transition.reason);

    let targetStatus = status;
    if (status === ORDER_STATUS.SUCCESS && order.payment?.status === PAYMENT_STATUS.COMPLETED) {
      targetStatus = ORDER_STATUS.DELIVERED;
    }

    return this.orderRepository.setStatus(id, targetStatus);
  }

  async getTopSellingProducts(limit = 5) {
    requireDependency(this.orderItemRepository, 'OrderItem');
    return this.orderItemRepository.getTopSellingProducts(toPositiveInteger(limit, 'limit'));
  }

  async getLowStockVariants(threshold = 10) {
    requireDependency(this.variantRepository, 'Variant');
    const normalizedThreshold = toPositiveInteger(threshold, 'threshold');
    return this.variantRepository.findLowStock(normalizedThreshold);
  }

  async listPaymentsByStatus(status = PAYMENT_STATUS.PENDING) {
    requireDependency(this.paymentRepository, 'Payment');
    if (!Object.values(PAYMENT_STATUS).includes(status)) {
      throw new ValidationError('Validation failed', [{ field: 'status', message: 'status is not supported' }]);
    }
    return this.paymentRepository.findByStatus(status);
  }

  _validateStatus(status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new ValidationError('Validation failed', [{ field: 'status', message: 'status is not supported' }]);
    }
  }
}
