const { test, after, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
require('tsx/cjs');

const { adminNotificationService: service } = require('../src/services/admin-notification.service');
const responses = [];

function response() {
  const res = new EventEmitter();
  res.messages = [];
  res.write = (message) => { res.messages.push(message); return true; };
  responses.push(res);
  return res;
}

function presence(res) {
  return res.messages
    .filter((message) => message.startsWith('event: presence\n'))
    .map((message) => JSON.parse(message.split('\ndata: ')[1]));
}

afterEach(() => {
  for (const res of responses.splice(0)) res.emit('close');
});
after(() => clearInterval(service.pingTimer));

test('visitors receive initial status and first/last admin transitions', () => {
  const visitor = response();
  service.addPresenceClient(visitor);
  assert.deepEqual(presence(visitor), [{ online: false }]);
  assert.equal(service.isAnyAdminOnline(), false);

  const first = response();
  const second = response();
  service.addClient('admin-1', first);
  service.addClient('admin-2', second);
  assert.deepEqual(presence(visitor), [{ online: false }, { online: true }]);

  const lateVisitor = response();
  service.addPresenceClient(lateVisitor);
  assert.deepEqual(presence(lateVisitor), [{ online: true }]);

  first.emit('close');
  assert.equal(service.isAnyAdminOnline(), true);
  assert.equal(presence(visitor).length, 2);
  second.emit('close');
  assert.deepEqual(presence(visitor).at(-1), { online: false });
  second.emit('close');
  assert.equal(presence(visitor).length, 3);
});

test('public subscribers never receive request details and are removed on disconnect', () => {
  const visitor = response();
  const admin = response();
  service.addPresenceClient(visitor);
  service.addClient('admin', admin);
  const before = visitor.messages.length;
  service.notifyNewHelpRequest({ id: 'private-request', question: 'Private question' });
  assert.equal(visitor.messages.length, before);
  assert.ok(admin.messages.some((message) => message.includes('private-request')));
  visitor.emit('close');
  admin.emit('close');
  assert.equal(visitor.messages.length, before);
});

test('failed admin connections update presence without breaking other subscribers', () => {
  const visitor = response();
  const brokenVisitor = response();
  const admin = response();
  service.addPresenceClient(brokenVisitor);
  service.addPresenceClient(visitor);
  brokenVisitor.write = () => { throw new Error('Disconnected'); };
  service.addClient('admin', admin);
  admin.write = () => { throw new Error('Disconnected'); };
  service.notifyNewHelpRequest({ id: 'request' });
  assert.equal(service.isAnyAdminOnline(), false);
  assert.deepEqual(presence(visitor), [{ online: false }, { online: true }, { online: false }]);
});
