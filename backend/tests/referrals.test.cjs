const { test } = require('node:test');
const assert = require('node:assert/strict');
require('tsx/cjs');

// Exercise the real registration and payment handlers with an isolated database double.
const db = { refreshToken: { create: async () => ({}) } };
global.prisma = db;
const router = require('../src/routes/auth.routes').default;
const register = router.stack.find((layer) => layer.route?.path === '/register').route.stack[0].handle;
const { processSuccessfulPayment } = require('../src/services/payment.service');

function registerUser(role, referralCode) {
  return new Promise((resolve, reject) => {
    register({ body: {
      fullName: 'Test User', nationalId: '1234567890', jobTitle: 'Tester',
      role, password: 'secret123', phone: '09123456789', city: 'Tehran',
      province: 'Tehran', acceptedTerms: true, referralCode,
    } }, { status() { return this; }, json: resolve }, reject);
  });
}

for (const role of ['CUSTOMER', 'COWORKER']) {
  test(`${role} registration validates and saves optional referrals`, async () => {
    const links = [];
    let created = 0;
    db.user = {
      findUnique: async () => null,
      create: async ({ data }) => { created++; return { ...data, id: 'user' }; },
    };
    db.marketerProfile = { findUnique: async ({ where }) =>
      where.referralCode === 'MK-VALID' ? { id: 'marketer' } : null };
    db.coworkerLink = { create: async ({ data }) => links.push(data) };
    db.$transaction = async (fn) => fn(db);
    await registerUser(role, ' mk-valid ');
    assert.deepEqual(links, [{ coworkerId: 'user', marketerProfileId: 'marketer' }]);
    await registerUser(role, '   ');
    await registerUser(role, undefined);
    assert.equal(links.length, 1);
    await assert.rejects(registerUser(role, 'INVALID'), { statusCode: 400 });
    assert.equal(created, 3);
  });
}

for (const role of ['CUSTOMER', 'COWORKER', 'MARKETER', 'ADMIN']) {
  test(`${role} paid interactions award only eligible referral commissions once`, async () => {
    for (const linked of [true, false]) {
      for (const [interactionNumber, rate] of [[1, 0.1], [2, 0.07], [3, 0.05]]) {
        const commissions = [];
        const payment = {
          id: 'payment', status: 'PENDING', originalPrice: 100000,
          helpRequest: { id: 'request', userId: 'user', interactionNumber,
            user: { role, coworkerLink: linked ? { marketerProfile: { id: 'marketer' } } : null } },
        };
        db.payment = {
          findUnique: async () => payment,
          updateMany: async () => { payment.status = 'SUCCESS'; return { count: 1 }; },
        };
        db.helpRequest = { update: async () => ({}) };
        db.marketerCommission = { create: async ({ data }) => commissions.push(data) };
        db.$transaction = async (fn) => fn(db);
        await processSuccessfulPayment('payment');
        await processSuccessfulPayment('payment');
        if (linked && ['CUSTOMER', 'COWORKER'].includes(role)) {
          assert.deepEqual(commissions, [{ paymentId: 'payment', marketerProfileId: 'marketer',
            interactionNumber, rate, amount: Math.round(100000 * rate) }]);
        } else {
          assert.deepEqual(commissions, []);
        }
      }
    }
  });
}
