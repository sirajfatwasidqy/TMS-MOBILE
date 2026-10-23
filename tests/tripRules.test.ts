import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createSeedData } from '../src/data/seed.ts';
import { authenticate, validateLogin } from '../src/services/auth.ts';
import {
  confirmDelivery,
  filterOrders,
  filterTrips,
  ordersOfTrip,
  reportFailure,
  startOrder,
  startTrip,
  summarizeDay,
  withinRange,
} from '../src/services/tripRules.ts';
import { toDateKey } from '../src/utils/date.ts';

const NOW = new Date(2026, 9, 23, 10, 30);
const TODAY = toDateKey(NOW);
const seed = () => createSeedData(NOW);

function unwrap<T>(r: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

describe('seed data integrity', () => {
  const data = seed();

  it('has unique trip, order, and activity ids', () => {
    for (const ids of [data.trips.map((t) => t.id), data.orders.map((o) => o.id), data.activities.map((a) => a.id)]) {
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  it('links every order to an existing trip with contiguous stop numbers', () => {
    for (const o of data.orders) assert.ok(data.trips.some((t) => t.id === o.tripId));
    for (const t of data.trips) {
      const seq = ordersOfTrip(data.orders, t.id).map((o) => o.sequence);
      assert.deepEqual(seq, seq.map((_, i) => i + 1));
      assert.ok(seq.length > 0);
    }
  });

  it('keeps trip status consistent with its orders', () => {
    for (const t of data.trips) {
      const stops = ordersOfTrip(data.orders, t.id);
      if (t.status === 'Completed') {
        assert.ok(stops.every((o) => o.status !== 'Assigned' && o.status !== 'In Transit'));
        assert.ok(stops.some((o) => o.status === 'Delivered'));
      }
      if (t.status === 'Failed') assert.ok(stops.every((o) => o.status === 'Failed'));
      if (t.status === 'Assigned') assert.ok(stops.every((o) => o.status === 'Assigned'));
    }
  });

  it('has at most one trip in progress and one order in transit', () => {
    assert.equal(data.trips.filter((t) => t.status === 'In Progress').length, 1);
    assert.equal(data.orders.filter((o) => o.status === 'In Transit').length, 1);
  });

  it('summarises today consistently', () => {
    const s = summarizeDay(data.trips, TODAY);
    assert.deepEqual(s, { total: 2, active: 1, completed: 0, pending: 1, failed: 0 });
  });
});

describe('trip rules', () => {
  it('blocks starting a trip while another is in progress', () => {
    const data = seed();
    const pending = data.trips.find((t) => t.date === TODAY && t.status === 'Assigned');
    const r = startTrip(data, pending!.id, NOW);
    assert.equal(r.ok, false);
  });

  it('blocks starting a trip scheduled for another day', () => {
    const data = seed();
    const tomorrow = data.trips.find((t) => t.date !== TODAY && t.status === 'Assigned');
    const r = startTrip(data, tomorrow!.id, NOW);
    assert.equal(r.ok, false);
  });

  it('starts a trip once nothing else is active', () => {
    let data = seed();
    const active = data.trips.find((t) => t.status === 'In Progress')!;
    // Finish the live trip: deliver stop 2 (high priority needs proof), then fail stop 3.
    const stop2 = data.orders.find((o) => o.tripId === active.id && o.sequence === 2)!;
    data = unwrap(confirmDelivery(data, stop2.id, { receivedBy: 'Bu Rina', proofCaptured: true }, NOW));
    const stop3 = data.orders.find((o) => o.tripId === active.id && o.sequence === 3)!;
    data = unwrap(startOrder(data, stop3.id, NOW));
    data = unwrap(reportFailure(data, stop3.id, { reason: 'Alamat tidak ditemukan' }, NOW));
    assert.equal(data.trips.find((t) => t.id === active.id)!.status, 'Completed');

    const pending = data.trips.find((t) => t.date === TODAY && t.status === 'Assigned')!;
    data = unwrap(startTrip(data, pending.id, NOW));
    assert.equal(data.trips.find((t) => t.id === pending.id)!.status, 'In Progress');
  });
});

describe('delivery rules', () => {
  const live = (d: ReturnType<typeof seed>) => d.trips.find((t) => t.status === 'In Progress')!;

  it('rejects completing an order that is not in transit', () => {
    const data = seed();
    const assigned = data.orders.find((o) => o.tripId === live(data).id && o.status === 'Assigned')!;
    assert.equal(confirmDelivery(data, assigned.id, { receivedBy: 'Pak Budi', proofCaptured: true }, NOW).ok, false);
  });

  it('rejects starting a second order while one is in transit', () => {
    const data = seed();
    const assigned = data.orders.find((o) => o.tripId === live(data).id && o.status === 'Assigned')!;
    assert.equal(startOrder(data, assigned.id, NOW).ok, false);
  });

  it('validates receiver name and proof for high priority orders', () => {
    const data = seed();
    const inTransit = data.orders.find((o) => o.status === 'In Transit')!;
    assert.equal(inTransit.priority, 'High');
    assert.equal(confirmDelivery(data, inTransit.id, { receivedBy: 'Bo', proofCaptured: true }, NOW).ok, false);
    assert.equal(confirmDelivery(data, inTransit.id, { receivedBy: 'Pak Budi', proofCaptured: false }, NOW).ok, false);
    const done = unwrap(confirmDelivery(data, inTransit.id, { receivedBy: ' Pak Budi ', proofCaptured: true }, NOW));
    const order = done.orders.find((o) => o.id === inTransit.id)!;
    assert.equal(order.status, 'Delivered');
    assert.equal(order.receivedBy, 'Pak Budi');
    assert.ok(done.activities[0].message.includes(inTransit.id));
  });

  it('requires a valid failure reason and a note for "Other"', () => {
    const data = seed();
    const inTransit = data.orders.find((o) => o.status === 'In Transit')!;
    assert.equal(reportFailure(data, inTransit.id, { reason: 'Made up' }, NOW).ok, false);
    assert.equal(reportFailure(data, inTransit.id, { reason: 'Lainnya', note: 'no' }, NOW).ok, false);
    assert.equal(reportFailure(data, inTransit.id, { reason: 'Lainnya', note: 'Gerbang terkunci' }, NOW).ok, true);
  });

  it('closes the trip as Completed when at least one stop was delivered', () => {
    let data = seed();
    const active = live(data);
    const stops = ordersOfTrip(data.orders, active.id);
    // Stop 1 is already delivered in the seed, so failing the rest still closes the trip as Completed.
    data = unwrap(reportFailure(data, stops[1].id, { reason: 'Akses lokasi dibatasi' }, NOW));
    data = unwrap(startOrder(data, stops[2].id, NOW));
    data = unwrap(reportFailure(data, stops[2].id, { reason: 'Akses lokasi dibatasi' }, NOW));
    assert.equal(data.trips.find((t) => t.id === active.id)!.status, 'Completed');
  });
});

describe('filters and auth', () => {
  it('filters orders by status and free-text query', () => {
    const { orders } = seed();
    assert.ok(filterOrders(orders, { query: '', status: 'Failed' }).every((o) => o.status === 'Failed'));
    const hits = filterOrders(orders, { query: 'bekasi', status: 'All' });
    assert.ok(hits.length >= 2 && hits.every((o) => JSON.stringify(o).toLowerCase().includes('bekasi')));
    assert.equal(filterOrders(orders, { query: 'zzz-none', status: 'All' }).length, 0);
  });

  it('filters trips by status and sorts newest first', () => {
    const { trips } = seed();
    const all = filterTrips(trips, 'All');
    assert.deepEqual(all.map((t) => t.date), [...all.map((t) => t.date)].sort().reverse());
    assert.ok(filterTrips(trips, 'Completed').every((t) => t.status === 'Completed'));
  });

  it('applies history date ranges', () => {
    assert.equal(withinRange(TODAY, TODAY, '3d'), true);
    assert.equal(withinRange('2026-10-18', TODAY, '3d'), false);
    assert.equal(withinRange('2026-10-18', TODAY, '7d'), true);
    assert.equal(withinRange('2020-01-01', TODAY, 'all'), true);
  });

  it('validates login input and the demo credentials', () => {
    assert.ok(validateLogin('', '').driverId);
    assert.ok(validateLogin('abc', '123RAJA').driverId);
    assert.ok(validateLogin('RAJA123', '123').password);
    assert.deepEqual(validateLogin('raja123', '123RAJA'), {});
    assert.ok(authenticate('raja123', '123RAJA'));
    assert.equal(authenticate('RAJA123', 'salahsandi'), null);
    assert.equal(authenticate('RAJA123', '123raja'), null);
  });
});
