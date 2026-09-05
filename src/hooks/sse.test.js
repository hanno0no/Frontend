import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventsUrl, isSseOpen, subscribeSse } from './sse.js';

class FakeEventSource {
  constructor(url) {
    this.url = url;
    this.listeners = new Map();
    this.closed = false;
  }
  addEventListener(name, fn) {
    const list = this.listeners.get(name) || [];
    list.push(fn);
    this.listeners.set(name, list);
  }
  removeEventListener(name, fn) {
    const list = (this.listeners.get(name) || []).filter((item) => item !== fn);
    this.listeners.set(name, list);
  }
  close() {
    this.closed = true;
  }
  emit(name) {
    for (const fn of this.listeners.get(name) || []) {
      fn({ type: name });
    }
  }
}

test('isSseOpen is true only for readyState OPEN', () => {
  assert.equal(isSseOpen(null), false);
  assert.equal(isSseOpen({ readyState: 0 }), false);
  assert.equal(isSseOpen({ readyState: 1 }), true);
  assert.equal(isSseOpen({ readyState: 2 }), false);
});

test('eventsUrl joins /events without double slash', () => {
  assert.equal(
    eventsUrl('http://localhost:8080/hnn'),
    'http://localhost:8080/hnn/events',
  );
  assert.equal(
    eventsUrl('http://localhost:8080/hnn/'),
    'http://localhost:8080/hnn/events',
  );
});

test('subscribeSse dispatches named events and close stops further calls', () => {
  const calls = [];
  const sub = subscribeSse(
    'http://localhost:8080/hnn/events',
    {
      index_updated: () => calls.push('index'),
      orders_updated: () => calls.push('orders'),
    },
    FakeEventSource,
  );

  sub.eventSource.emit('index_updated');
  sub.eventSource.emit('orders_updated');
  assert.deepEqual(calls, ['index', 'orders']);

  sub.close();
  sub.eventSource.emit('index_updated');
  assert.deepEqual(calls, ['index', 'orders']);
  assert.equal(sub.eventSource.closed, true);
});
