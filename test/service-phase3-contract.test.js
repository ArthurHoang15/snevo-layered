import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import OrderService from '../backend/business/services/OrderService.js';

const serviceDir = join(process.cwd(), 'backend', 'business', 'services');

async function source(fileName) {
  return readFile(join(serviceDir, fileName), 'utf8');
}

test('all service modules can be imported without repository instances', async () => {
  const files = (await readdir(serviceDir)).filter((file) => file.endsWith('.js'));
  await Promise.all(files.map((file) => import(`../backend/business/services/${file}`)));
});

test('services do not import Supabase or presentation layer code', async () => {
  const files = (await readdir(serviceDir)).filter((file) => file.endsWith('.js'));
  for (const file of files) {
    const text = await source(file);
    assert.doesNotMatch(text, /supabase|createSupabaseConfig|getAdminClient/);
    assert.doesNotMatch(text, /presentation|writeHead|\.end\(/);
    assert.doesNotMatch(text, /\b(req|res)\b/);
  }
});

test('OrderService.createOrder validates cart, writes checkout records, updates stock, and clears cart', async () => {
  const calls = [];
  const orderRepository = {
    async createOrder(orderData) {
      calls.push(['createOrder', orderData]);
      return { ...orderData, order_id: 44, status: 'pending' };
    },
    async setStatus(orderId, status) {
      calls.push(['setStatus', orderId, status]);
      return { order_id: orderId, status };
    }
  };
  const orderItemRepository = {
    async insertItems(orderId, items) {
      calls.push(['insertItems', orderId, items]);
      return items.map((item, index) => ({ ...item, order_item_id: index + 1, order_id: orderId }));
    }
  };
  const cartRepository = {
    async listByUser(userId) {
      calls.push(['listCart', userId]);
      return [
        { cart_id: 1, user_id: userId, variant_id: 10, quantity: 2, price_at_add: 90 }
      ];
    },
    async clearUserCart(userId) {
      calls.push(['clearCart', userId]);
      return true;
    }
  };
  const paymentRepository = {
    async createPayment(paymentData) {
      calls.push(['createPayment', paymentData]);
      return { ...paymentData, payment_id: 5 };
    }
  };
  const addressRepository = {
    async findById(addressId) {
      calls.push(['findAddress', addressId]);
      return { address_id: addressId, user_id: 'user-1' };
    }
  };
  const variantRepository = {
    async findById(variantId) {
      calls.push(['findVariant', variantId]);
      return { variant_id: variantId, stock_quantity: 5, variant_price: 100, is_active: true };
    },
    async setStockQuantity(variantId, stockQuantity) {
      calls.push(['setStock', variantId, stockQuantity]);
      return { variant_id: variantId, stock_quantity: stockQuantity };
    }
  };

  const service = new OrderService({
    orderRepository,
    orderItemRepository,
    cartRepository,
    paymentRepository,
    addressRepository,
    variantRepository,
    pricingPolicy: { taxRate: 0.1, shippingCost: 5 }
  });

  const checkout = await service.createOrder('user-1', {
    address_id: 7,
    payment_method: 'credit_card',
    payment_details: { cardNumber: '4111111111111234' },
    notes: 'leave at door'
  });

  assert.deepEqual(checkout.totals, {
    subtotal: 180,
    tax_amount: 18,
    shipping_cost: 5,
    total_amount: 203
  });
  assert.equal(checkout.order.status, 'processing');
  assert.equal(checkout.payment.status, 'completed');
  assert.equal(checkout.order_items[0].price_per_unit, 90);
  assert.deepEqual(calls.map((call) => call[0]), [
    'findAddress',
    'listCart',
    'findVariant',
    'createOrder',
    'insertItems',
    'setStock',
    'createPayment',
    'setStatus',
    'clearCart'
  ]);
  assert.deepEqual(calls.find((call) => call[0] === 'setStock'), ['setStock', 10, 3]);
});
