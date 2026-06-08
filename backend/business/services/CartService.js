import { BusinessLogicError, NotFoundError, ValidationError } from '../../infrastructure/errors/ErrorClasses.js';

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

function toQuantity(value, field = 'quantity') {
  return toPositiveInteger(value, field);
}

function getUnitPrice(variant, fallback = undefined) {
  const price = fallback ?? variant?.variant_price ?? variant?.shoes?.base_price;
  const parsed = Number(price);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCartItem(item) {
  const variant = item.shoe_variants || {};
  const unitPrice = getUnitPrice(variant, item.price_at_add);
  const quantity = Number(item.quantity || 0);
  return {
    ...item,
    unit_price: unitPrice,
    line_total: Number((unitPrice * quantity).toFixed(2))
  };
}

export default class CartService {
  constructor({ cartRepository, variantRepository } = {}) {
    this.cartRepository = cartRepository;
    this.variantRepository = variantRepository;
  }

  async getCart(userId) {
    requireDependency(this.cartRepository, 'Cart');
    const items = await this.cartRepository.listByUser(userId);
    const normalizedItems = items.map(normalizeCartItem);
    return {
      items: normalizedItems,
      summary: this.calculateSummary(normalizedItems)
    };
  }

  calculateSummary(items = []) {
    const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.line_total ?? getUnitPrice(item.shoe_variants, item.price_at_add) * Number(item.quantity || 0);
      return sum + Number(lineTotal || 0);
    }, 0);

    return {
      item_count: itemCount,
      subtotal: Number(subtotal.toFixed(2))
    };
  }

  async addItem(userId, cartData = {}) {
    requireDependency(this.cartRepository, 'Cart');
    requireDependency(this.variantRepository, 'Variant');
    const variantId = toPositiveInteger(cartData.variant_id, 'variant_id');
    const quantityToAdd = toQuantity(cartData.quantity ?? 1);
    const variant = await this._getAvailableVariant(variantId);
    const existingItem = await this.cartRepository.findByUserAndVariant(userId, variantId);
    const nextQuantity = Number(existingItem?.quantity || 0) + quantityToAdd;

    this._ensureStock(variant, nextQuantity);
    const priceAtAdd = getUnitPrice(variant);

    if (existingItem) {
      const item = await this.cartRepository.updateItem(existingItem.cart_id, {
        quantity: nextQuantity,
        price_at_add: priceAtAdd
      });
      return { item, action: 'updated' };
    }

    const item = await this.cartRepository.createItem({
      user_id: userId,
      variant_id: variantId,
      quantity: quantityToAdd,
      price_at_add: priceAtAdd
    });
    return { item, action: 'created' };
  }

  async updateItem(userId, cartId, cartData = {}) {
    requireDependency(this.cartRepository, 'Cart');
    requireDependency(this.variantRepository, 'Variant');
    const id = toPositiveInteger(cartId, 'cart_id');
    const currentItem = await this._getOwnedCartItem(userId, id);
    const nextQuantity = cartData.quantity !== undefined
      ? Number.parseInt(cartData.quantity, 10)
      : Number(currentItem.quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      throw new ValidationError('Validation failed', [{ field: 'quantity', message: 'quantity must be zero or greater' }]);
    }

    if (nextQuantity === 0) {
      await this.cartRepository.removeItem(id);
      return { removed: true };
    }

    const variantId = cartData.variant_id !== undefined
      ? toPositiveInteger(cartData.variant_id, 'variant_id')
      : currentItem.variant_id;
    const variant = await this._getAvailableVariant(variantId);
    this._ensureStock(variant, nextQuantity);

    const item = await this.cartRepository.updateItem(id, {
      quantity: nextQuantity,
      variant_id: variantId,
      price_at_add: getUnitPrice(variant, currentItem.price_at_add)
    });
    return { item, action: 'updated' };
  }

  async removeItem(userId, cartId) {
    requireDependency(this.cartRepository, 'Cart');
    const id = toPositiveInteger(cartId, 'cart_id');
    await this._getOwnedCartItem(userId, id);
    await this.cartRepository.removeItem(id);
    return { removed: true };
  }

  async clearCart(userId) {
    requireDependency(this.cartRepository, 'Cart');
    await this.cartRepository.clearUserCart(userId);
    return { cleared: true };
  }

  async _getOwnedCartItem(userId, cartId) {
    const item = await this.cartRepository.findById(cartId);
    if (!item || item.user_id !== userId) throw new NotFoundError('Cart item');
    return item;
  }

  async _getAvailableVariant(variantId) {
    const variant = await this.variantRepository.findById(variantId);
    if (!variant || variant.is_active === false) throw new NotFoundError('Variant');
    return variant;
  }

  _ensureStock(variant, neededQuantity) {
    const stockQuantity = Number(variant.stock_quantity || 0);
    if (stockQuantity < neededQuantity) {
      throw new BusinessLogicError('Insufficient stock available');
    }
  }
}
