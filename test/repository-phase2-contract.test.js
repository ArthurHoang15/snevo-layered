import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repositoryDir = join(process.cwd(), 'backend', 'data', 'repositories');

async function source(fileName) {
  return readFile(join(repositoryDir, fileName), 'utf8');
}

test('all repository modules can be imported without Supabase credentials', async () => {
  const files = (await readdir(repositoryDir)).filter((file) => file.endsWith('.js'));
  await Promise.all(files.map((file) => import(`../backend/data/repositories/${file}`)));
});

test('order repositories use reference order item schema fields', async () => {
  const orderItem = await source('OrderItemRepository.js');
  const order = await source('OrderRepository.js');

  assert.match(orderItem, /price_per_unit/);
  assert.doesNotMatch(orderItem, /unit_price/);
  assert.doesNotMatch(orderItem, /subtotal/);

  assert.match(order, /price_per_unit/);
  assert.doesNotMatch(order, /unit_price/);
  const createOrderBody = order.match(/async createOrder[\s\S]*?\n  async countAll/)?.[0] || '';
  assert.doesNotMatch(createOrderBody, /status:\s*['"]pending['"]/);
  assert.match(order, /\.in\(\s*['"]status['"],\s*\[\s*['"]processing['"],\s*['"]shipped['"],\s*['"]delivered['"]\s*\]\s*\)/);
});

test('payment repository writes only columns available in the reference schema', async () => {
  const payment = await source('PaymentRepository.js');

  assert.match(payment, /payment_date/);
  for (const forbidden of ['payment_details', 'paid_at', 'refund_note', 'refunded_at']) {
    assert.doesNotMatch(payment, new RegExp(forbidden));
  }
});

test('import repository uses reference import schema fields', async () => {
  const importRepository = await source('ImportRepository.js');

  for (const required of ['quantity_imported', 'import_price', 'supplier_id', 'import_date']) {
    assert.match(importRepository, new RegExp(required));
  }

  for (const forbidden of ['cost_price', 'supplier_name', 'p_quantity_change']) {
    assert.doesNotMatch(importRepository, new RegExp(forbidden));
  }

  assert.doesNotMatch(importRepository, /\bquantity:\s*item\.quantity\b/);
  assert.match(importRepository, /p_quantity:\s*-Number\(importRecord\.quantity_imported \|\| 0\)/);
  assert.match(importRepository, /p_operation:\s*['"]add['"]/);
});

test('repositories expose query helpers, not business decision wrappers', async () => {
  const category = await source('CategoryRepository.js');
  const review = await source('ReviewRepository.js');
  const cart = await source('CartRepository.js');
  const shoe = await source('ShoeRepository.js');

  assert.doesNotMatch(category, /validateUniqueName\s*\(/);
  assert.match(category, /findByNameForUniqueness\s*\(/);

  assert.doesNotMatch(review, /verifyPurchase\s*\(/);
  assert.match(review, /findPurchasedOrderItems\s*\(/);

  assert.doesNotMatch(cart, /async\s+summary\s*\(/);
  assert.doesNotMatch(cart, /tax_amount|shipping_cost|total_amount/);

  assert.doesNotMatch(shoe, /can_restore|will_restore|will_skip|skip_reason/);
});
