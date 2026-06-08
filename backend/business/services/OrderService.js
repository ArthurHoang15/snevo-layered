import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../infrastructure/utils/constants.js';
import {
  generateMockPaymentDetails,
  shouldAutoApproveOrder,
  shouldAutoCompletePayment,
  validateOrderTransition
} from '../../infrastructure/utils/orderUtils.js';

const DEFAULT_PRICING_POLICY = {
  taxRate: 0,
  shippingCost: 0,
  freeShippingThreshold: null
};

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

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getUnitPrice(cartItem, variant) {
  const price = cartItem?.price_at_add ?? cartItem?.shoe_variants?.variant_price ?? variant?.variant_price ?? variant?.shoes?.base_price;
  const parsed = Number(price);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validPaymentMethods() {
  return new Set(Object.values(PAYMENT_METHODS));
}

export default class OrderService {
  constructor({
    orderRepository,
    orderItemRepository,
    cartRepository,
    paymentRepository,
    addressRepository,
    variantRepository,
    pricingPolicy = {}
  } = {}) {
    this.orderRepository = orderRepository;
    this.orderItemRepository = orderItemRepository;
    this.cartRepository = cartRepository;
    this.paymentRepository = paymentRepository;
    this.addressRepository = addressRepository;
    this.variantRepository = variantRepository;
    this.pricingPolicy = { ...DEFAULT_PRICING_POLICY, ...pricingPolicy };
  }

  async listUserOrders(userId, { status = null, page = 1, limit = 10 } = {}) {
    requireDependency(this.orderRepository, 'Order');
    return this.orderRepository.findByUserId(userId, status, Number.parseInt(page, 10), Number.parseInt(limit, 10));
  }

  async getOrderById(orderId, userId = null) {
    requireDependency(this.orderRepository, 'Order');
    const id = toPositiveInteger(orderId, 'order_id');
    const order = await this.orderRepository.findWithItems(id);
    if (!order) throw new NotFoundError('Order');
    if (userId !== null && order.user_id !== userId) throw new NotFoundError('Order');
    return order;
  }

  async createOrder(userId, orderData = {}) {
    this._assertCheckoutDependencies();
    const addressId = toPositiveInteger(orderData.address_id, 'address_id');
    const paymentMethod = this._validatePaymentMethod(orderData.payment_method);
    const address = await this._getOwnedAddress(userId, addressId);
    const cartItems = await this.cartRepository.listByUser(userId);

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new BusinessLogicError('Cart is empty');
    }

    const checkoutItems = await this._buildCheckoutItems(cartItems);
    const totals = this.calculateTotals(checkoutItems);
    const paymentStatus = shouldAutoCompletePayment(paymentMethod)
      ? PAYMENT_STATUS.COMPLETED
      : PAYMENT_STATUS.PENDING;
    const initialOrderStatus = ORDER_STATUS.PENDING;

    const order = await this.orderRepository.createOrder({
      user_id: userId,
      address_id: addressId,
      total_amount: totals.total_amount,
      shipping_cost: totals.shipping_cost,
      tax_amount: totals.tax_amount,
      notes: orderData.notes ?? null,
      status: initialOrderStatus
    });

    const orderItems = await this.orderItemRepository.insertItems(order.order_id, checkoutItems.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      price_per_unit: item.price_per_unit
    })));

    await this._decrementStock(checkoutItems);

    const payment = await this.paymentRepository.createPayment({
      order_id: order.order_id,
      payment_method: paymentMethod,
      payment_amount: totals.total_amount,
      status: paymentStatus,
      transaction_id: generateMockPaymentDetails(paymentMethod, orderData.payment_details || orderData)
    });

    let finalOrder = order;
    if (shouldAutoApproveOrder(paymentMethod, payment.status)) {
      finalOrder = await this.orderRepository.setStatus(order.order_id, ORDER_STATUS.SUCCESS);
    }

    await this.cartRepository.clearUserCart(userId);

    return {
      order: finalOrder,
      order_items: orderItems,
      payment,
      address,
      totals
    };
  }

  calculateTotals(items = []) {
    const subtotal = roundMoney(items.reduce((sum, item) => {
      return sum + Number(item.price_per_unit || 0) * Number(item.quantity || 0);
    }, 0));
    const taxAmount = roundMoney(subtotal * Number(this.pricingPolicy.taxRate || 0));
    const shippingCost = this._calculateShippingCost(subtotal);
    const totalAmount = roundMoney(subtotal + taxAmount + shippingCost);

    return {
      subtotal,
      tax_amount: taxAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount
    };
  }

  async updateOrderStatus(orderId, newStatus) {
    requireDependency(this.orderRepository, 'Order');
    requireDependency(this.paymentRepository, 'Payment');
    const id = toPositiveInteger(orderId, 'order_id');
    this._validateOrderStatus(newStatus);
    const order = await this.orderRepository.getWithPayment(id);
    if (!order) throw new NotFoundError('Order');
    const transition = validateOrderTransition(order, newStatus, order.payment);
    if (!transition.valid) throw new BusinessLogicError(transition.reason);
    return this.orderRepository.setStatus(id, newStatus);
  }

  async cancelOrder(orderId, userId = null) {
    const order = await this.getOrderById(orderId, userId);
    if (order.status !== ORDER_STATUS.PENDING) {
      throw new BusinessLogicError('Only pending orders can be cancelled');
    }
    return this.orderRepository.setStatus(order.order_id, ORDER_STATUS.CANCELLED);
  }

  async getAllOrders({ status = null, page = 1, limit = 10, search = '' } = {}) {
    requireDependency(this.orderRepository, 'Order');
    return this.orderRepository.getAllOrders(status, page, limit, search);
  }

  _assertCheckoutDependencies() {
    requireDependency(this.orderRepository, 'Order');
    requireDependency(this.orderItemRepository, 'OrderItem');
    requireDependency(this.cartRepository, 'Cart');
    requireDependency(this.paymentRepository, 'Payment');
    requireDependency(this.addressRepository, 'Address');
    requireDependency(this.variantRepository, 'Variant');
  }

  _validatePaymentMethod(paymentMethod) {
    const method = typeof paymentMethod === 'string' ? paymentMethod.trim() : '';
    if (!method) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'payment_method is required' }]);
    }
    if (!validPaymentMethods().has(method)) {
      throw new ValidationError('Validation failed', [{ field: 'payment_method', message: 'payment_method is not supported' }]);
    }
    return method;
  }

  _validateOrderStatus(status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new ValidationError('Validation failed', [{ field: 'status', message: 'status is not supported' }]);
    }
  }

  async _getOwnedAddress(userId, addressId) {
    const address = await this.addressRepository.findById(addressId);
    if (!address || address.user_id !== userId) throw new NotFoundError('Address');
    return address;
  }

  async _buildCheckoutItems(cartItems) {
    const checkoutItems = [];

    for (const cartItem of cartItems) {
      const variantId = toPositiveInteger(cartItem.variant_id, 'variant_id');
      const quantity = toPositiveInteger(cartItem.quantity, 'quantity');
      const variant = await this.variantRepository.findById(variantId);
      if (!variant || variant.is_active === false) throw new NotFoundError('Variant');
      const stockQuantity = Number(variant.stock_quantity || 0);
      if (stockQuantity < quantity) {
        throw new BusinessLogicError(`Insufficient stock for variant ${variantId}`);
      }

      checkoutItems.push({
        variant_id: variantId,
        quantity,
        price_per_unit: getUnitPrice(cartItem, variant),
        stock_quantity: stockQuantity
      });
    }

    return checkoutItems;
  }

  async _decrementStock(items) {
    for (const item of items) {
      const nextStock = Math.max(0, Number(item.stock_quantity || 0) - Number(item.quantity || 0));
      await this.variantRepository.setStockQuantity(item.variant_id, nextStock);
    }
  }

  _calculateShippingCost(subtotal) {
    const threshold = this.pricingPolicy.freeShippingThreshold;
    if (threshold !== null && threshold !== undefined && subtotal >= Number(threshold)) return 0;
    return roundMoney(this.pricingPolicy.shippingCost);
  }
}
