const { test } = require('node:test');
const assert = require('node:assert/strict');
require('tsx/cjs');

const db = {};
global.prisma = db;
const { processSuccessfulPayment, validateDiscountCode } = require('../src/services/payment.service');
const { seedDiscountCodes } = require('../prisma/seed-discount-codes');
// Synthetic fixtures only; never load or publish the real redeemable inventory.
const WELCOME_CODES = Array.from({ length: 1000 }, (_, index) =>
  `WELCOME-${index.toString(16).toUpperCase().padStart(16, '0')}`);

test('seed creates exactly 1000 single-use codes without resetting existing redemptions', async () => {
  assert.equal(WELCOME_CODES.length, 1000);
  assert.equal(new Set(WELCOME_CODES).size, 1000);
  assert.ok(WELCOME_CODES.every((code) => /^WELCOME-[A-F0-9]{16}$/.test(code)));
  const rows = new Map([['WELCOME100', { code: 'WELCOME100', isActive: true, usedCount: 5 }]]);
  const client = {
    discountCode: {
      updateMany: async ({ where, data }) => Object.assign(rows.get(where.code), data),
      createMany: async ({ data, skipDuplicates }) => {
        assert.equal(skipDuplicates, true);
        let count = 0;
        for (const row of data) {
          if (!rows.has(row.code)) {
            rows.set(row.code, { ...row, usedCount: 0, isActive: true });
            count++;
          }
        }
        return { count };
      },
    },
    $transaction: async (fn) => fn(client),
  };
  assert.equal((await seedDiscountCodes(client, WELCOME_CODES)).count, 1000);
  const used = rows.get(WELCOME_CODES[0]);
  Object.assign(used, { usedCount: 1, isActive: false });
  assert.equal((await seedDiscountCodes(client, WELCOME_CODES)).count, 0);
  assert.equal(used.usedCount, 1);
  assert.equal(used.isActive, false);
  assert.equal(rows.get('WELCOME100').isActive, false);
  assert.equal(rows.get('WELCOME100').usedCount, 5);
  for (const code of WELCOME_CODES) {
    assert.equal(rows.get(code).maxUses, 1);
    assert.equal(rows.get(code).percentOff, 100);
    assert.equal(rows.get(code).firstTimeOnly, true);
  }
});

test('invalid or duplicate inventories fail before touching the database', async () => {
  const client = { $transaction: () => assert.fail('Must not touch the database') };
  await assert.rejects(seedDiscountCodes(client, []), /1,000 unique valid codes/);
  await assert.rejects(seedDiscountCodes(client, Array(1000).fill(WELCOME_CODES[0])), /1,000 unique valid codes/);
  await assert.rejects(seedDiscountCodes(client, [...WELCOME_CODES.slice(1), 'invalid']), /1,000 unique valid codes/);
});

test('completion consumes a code only once and rejects a second prevalidated checkout', async () => {
  const discount = { id: 'discount', maxUses: 1, usedCount: 0, isActive: true };
  const payments = new Map(['first', 'second'].map((id) => [id, {
    id, status: 'PENDING', originalPrice: 100000, discountCodeId: discount.id,
    helpRequest: { id: `request-${id}`, userId: id, interactionNumber: 1,
      status: 'PRICED', user: { role: 'CUSTOMER', coworkerLink: null } },
  }]));
  db.payment = { findUnique: async ({ where }) => payments.get(where.id) };
  db.$transaction = async (fn) => {
    const snapshot = structuredClone([...payments]);
    const oldUsedCount = discount.usedCount;
    try {
      return await fn({
        payment: { updateMany: async ({ where, data }) => {
          const payment = payments.get(where.id);
          if (payment.status === 'SUCCESS') return { count: 0 };
          Object.assign(payment, data);
          return { count: 1 };
        } },
        discountCode: {
          findUnique: async () => ({ ...discount }),
          updateMany: async ({ where, data }) => {
            assert.equal(where.id, discount.id);
            assert.equal(where.isActive, true);
            assert.equal(where.usedCount.lt, 1);
            if (discount.usedCount >= where.usedCount.lt) return { count: 0 };
            discount.usedCount += data.usedCount.increment;
            return { count: 1 };
          },
        },
        helpRequest: { update: async ({ where, data }) => {
          const payment = [...payments.values()].find((p) => p.helpRequest.id === where.id);
          Object.assign(payment.helpRequest, data);
        } },
      });
    } catch (error) {
      for (const [id, payment] of snapshot) payments.set(id, payment);
      discount.usedCount = oldUsedCount;
      throw error;
    }
  };
  await processSuccessfulPayment('first');
  await processSuccessfulPayment('first');
  assert.equal(discount.usedCount, 1);
  assert.equal(payments.get('first').helpRequest.status, 'PAID');
  await assert.rejects(processSuccessfulPayment('second'), { statusCode: 400 });
  assert.equal(discount.usedCount, 1);
  assert.equal(payments.get('second').status, 'PENDING');
  assert.equal(payments.get('second').helpRequest.status, 'PRICED');
});

test('validation retains first-purchase restriction and rejects exhausted or inactive codes', async () => {
  const discount = { id: 'discount', isActive: true, maxUses: 1, usedCount: 0, firstTimeOnly: true };
  db.discountCode = { findUnique: async ({ where }) => {
    assert.equal(where.code, WELCOME_CODES[0]);
    return discount;
  } };
  db.payment = { findFirst: async () => null };
  assert.equal(await validateDiscountCode(WELCOME_CODES[0].toLowerCase(), 'user', 1), discount);
  await assert.rejects(validateDiscountCode(WELCOME_CODES[0], 'user', 2), { statusCode: 400 });
  discount.usedCount = 1;
  await assert.rejects(validateDiscountCode(WELCOME_CODES[0], 'another-user', 1), { statusCode: 400 });
  discount.usedCount = 0;
  discount.isActive = false;
  await assert.rejects(validateDiscountCode(WELCOME_CODES[0], 'user', 1), { statusCode: 400 });
});
