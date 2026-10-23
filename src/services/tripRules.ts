import { FAILURE_REASONS, LIMITS, OTHER_REASON } from '../constants/domain.ts';
import { STATUS_LABEL } from '../constants/labels.ts';
import type {
  Activity,
  ActivityKind,
  AppData,
  DeliveryOrder,
  OrderStatus,
  Trip,
  TripStatus,
} from '../types/index.ts';
import { diffDays, toDateKey } from '../utils/date.ts';

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const fail = <T = never>(error: string): Result<T> => ({ ok: false, error });

/* ---------- Tabel transisi status ---------- */

export const TRIP_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  Assigned: ['In Progress'],
  'In Progress': ['Completed', 'Failed'],
  Completed: [],
  Failed: [],
};

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Assigned: ['In Transit'],
  'In Transit': ['Delivered', 'Failed'],
  Delivered: [],
  Failed: [],
};

export const isTerminalOrder = (s: OrderStatus): boolean => s === 'Delivered' || s === 'Failed';

/* ---------- Fungsi bantu ---------- */

function appendActivity(
  data: AppData,
  kind: ActivityKind,
  message: string,
  now: Date,
  tripId: string,
  orderId?: string,
): AppData {
  const activity: Activity = {
    id: `ACT-${now.getTime()}-${data.activities.length}`,
    at: now.toISOString(),
    kind,
    message,
    tripId,
    orderId,
  };
  return { ...data, activities: [activity, ...data.activities] };
}

const replaceTrip = (data: AppData, trip: Trip): AppData => ({
  ...data,
  trips: data.trips.map((t) => (t.id === trip.id ? trip : t)),
});

const replaceOrder = (data: AppData, order: DeliveryOrder): AppData => ({
  ...data,
  orders: data.orders.map((o) => (o.id === order.id ? order : o)),
});

export const ordersOfTrip = (orders: DeliveryOrder[], tripId: string): DeliveryOrder[] =>
  orders.filter((o) => o.tripId === tripId).sort((a, b) => a.sequence - b.sequence);

/** Saat semua stop sebuah trip selesai, trip ditutup otomatis. */
function closeTripIfDone(data: AppData, tripId: string, now: Date): AppData {
  const trip = data.trips.find((t) => t.id === tripId);
  if (!trip || trip.status !== 'In Progress') return data;
  const stops = ordersOfTrip(data.orders, tripId);
  if (stops.length === 0 || !stops.every((o) => isTerminalOrder(o.status))) return data;

  const delivered = stops.filter((o) => o.status === 'Delivered').length;
  const status: TripStatus = delivered > 0 ? 'Completed' : 'Failed';
  const next = replaceTrip(data, { ...trip, status, completedAt: now.toISOString() });
  return status === 'Completed'
    ? appendActivity(next, 'trip_completed', `${tripId} selesai: ${delivered} dari ${stops.length} stop terkirim`, now, tripId)
    : appendActivity(next, 'trip_failed', `${tripId} berakhir tanpa pengiriman yang berhasil`, now, tripId);
}

/* ---------- Aksi ---------- */

export function startTrip(data: AppData, tripId: string, now: Date): Result<AppData> {
  const trip = data.trips.find((t) => t.id === tripId);
  if (!trip) return fail('Trip tidak ditemukan.');
  if (!TRIP_TRANSITIONS[trip.status].includes('In Progress')) {
    return fail(`Hanya trip berstatus Ditugaskan yang bisa dimulai. Status trip ini: ${STATUS_LABEL[trip.status].toLowerCase()}.`);
  }
  if (trip.date !== toDateKey(now)) {
    return fail('Trip hanya bisa dimulai pada tanggal jadwalnya.');
  }
  const active = data.trips.find((t) => t.status === 'In Progress');
  if (active) return fail(`Selesaikan ${active.id} sebelum memulai trip lain.`);
  if (ordersOfTrip(data.orders, tripId).length === 0) return fail('Trip ini belum memiliki delivery order.');

  const next = replaceTrip(data, { ...trip, status: 'In Progress', startedAt: now.toISOString() });
  return ok(appendActivity(next, 'trip_started', `Memulai ${tripId} menuju ${trip.destination}`, now, tripId));
}

export function startOrder(data: AppData, orderId: string, now: Date): Result<AppData> {
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return fail('Delivery order tidak ditemukan.');
  if (!ORDER_TRANSITIONS[order.status].includes('In Transit')) {
    return fail(`Hanya order berstatus Ditugaskan yang bisa dimulai. Status order ini: ${STATUS_LABEL[order.status].toLowerCase()}.`);
  }
  const trip = data.trips.find((t) => t.id === order.tripId);
  if (!trip || trip.status !== 'In Progress') return fail(`Mulai trip ${order.tripId} terlebih dahulu.`);
  const inTransit = data.orders.find((o) => o.tripId === order.tripId && o.status === 'In Transit');
  if (inTransit) return fail(`Selesaikan ${inTransit.id} sebelum memulai pengiriman lain.`);

  const next = replaceOrder(data, { ...order, status: 'In Transit', startedAt: now.toISOString() });
  return ok(appendActivity(next, 'order_started', `Memulai pengiriman ${order.id} ke ${order.recipient}`, now, order.tripId, order.id));
}

export interface DeliveryInput {
  receivedBy: string;
  note?: string;
  proofCaptured: boolean;
}

export function confirmDelivery(data: AppData, orderId: string, input: DeliveryInput, now: Date): Result<AppData> {
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return fail('Delivery order tidak ditemukan.');
  if (!ORDER_TRANSITIONS[order.status].includes('Delivered')) {
    return fail('Mulai pengiriman sebelum mengonfirmasinya.');
  }
  const receivedBy = input.receivedBy.trim();
  const note = (input.note ?? '').trim();
  if (receivedBy.length < LIMITS.receiverMin) {
    return fail(`Isi nama penerima barang (minimal ${LIMITS.receiverMin} karakter).`);
  }
  if (receivedBy.length > LIMITS.receiverMax) return fail(`Nama penerima terlalu panjang (maksimal ${LIMITS.receiverMax} karakter).`);
  if (note.length > LIMITS.noteMax) return fail(`Catatan terlalu panjang (maksimal ${LIMITS.noteMax} karakter).`);
  if (order.priority === 'High' && !input.proofCaptured) {
    return fail('Order prioritas tinggi wajib memiliki bukti pengiriman. Ambil bukti terlebih dahulu.');
  }

  const stamp = now.toISOString();
  let next = replaceOrder(data, {
    ...order,
    status: 'Delivered',
    completedAt: stamp,
    receivedBy,
    note: note || undefined,
    proofCapturedAt: input.proofCaptured ? stamp : undefined,
  });
  next = appendActivity(next, 'order_delivered', `${order.id} terkirim, diterima oleh ${receivedBy}`, now, order.tripId, order.id);
  return ok(closeTripIfDone(next, order.tripId, now));
}

export interface FailureInput {
  reason: string;
  note?: string;
}

export function reportFailure(data: AppData, orderId: string, input: FailureInput, now: Date): Result<AppData> {
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) return fail('Delivery order tidak ditemukan.');
  if (!ORDER_TRANSITIONS[order.status].includes('Failed')) {
    return fail('Hanya pengiriman yang sedang berjalan yang bisa dilaporkan gagal.');
  }
  if (!(FAILURE_REASONS as readonly string[]).includes(input.reason)) return fail('Pilih alasan kegagalan.');
  const note = (input.note ?? '').trim();
  if (note.length > LIMITS.noteMax) return fail(`Catatan terlalu panjang (maksimal ${LIMITS.noteMax} karakter).`);
  if (input.reason === OTHER_REASON && note.length < LIMITS.otherNoteMin) {
    return fail('Jelaskan apa yang terjadi jika alasannya "Lainnya".');
  }

  let next = replaceOrder(data, {
    ...order,
    status: 'Failed',
    completedAt: now.toISOString(),
    failureReason: input.reason,
    note: note || undefined,
  });
  next = appendActivity(next, 'order_failed', `${order.id} gagal: ${input.reason}`, now, order.tripId, order.id);
  return ok(closeTripIfDone(next, order.tripId, now));
}

/* ---------- Fungsi baca ---------- */

export interface DaySummary {
  total: number;
  active: number;
  completed: number;
  pending: number;
  failed: number;
}

export function summarizeDay(trips: Trip[], dateKey: string): DaySummary {
  const day = trips.filter((t) => t.date === dateKey);
  const count = (s: TripStatus) => day.filter((t) => t.status === s).length;
  return {
    total: day.length,
    active: count('In Progress'),
    completed: count('Completed'),
    pending: count('Assigned'),
    failed: count('Failed'),
  };
}

export function tripProgress(orders: DeliveryOrder[], tripId: string) {
  const stops = ordersOfTrip(orders, tripId);
  return {
    total: stops.length,
    finished: stops.filter((o) => isTerminalOrder(o.status)).length,
    delivered: stops.filter((o) => o.status === 'Delivered').length,
    failed: stops.filter((o) => o.status === 'Failed').length,
  };
}

const ORDER_RANK: Record<OrderStatus, number> = { 'In Transit': 0, Assigned: 1, Delivered: 2, Failed: 2 };
const PRIORITY_RANK = { High: 0, Normal: 1, Low: 2 } as const;

export function sortOrders(orders: DeliveryOrder[], priorityFirst: boolean): DeliveryOrder[] {
  return [...orders].sort((a, b) => {
    if (ORDER_RANK[a.status] !== ORDER_RANK[b.status]) return ORDER_RANK[a.status] - ORDER_RANK[b.status];
    if (priorityFirst && a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (ORDER_RANK[a.status] === 2) return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
    return a.tripId === b.tripId ? a.sequence - b.sequence : a.tripId.localeCompare(b.tripId);
  });
}

export function filterOrders(
  orders: DeliveryOrder[],
  opts: { query: string; status: OrderStatus | 'All' },
): DeliveryOrder[] {
  const q = opts.query.trim().toLowerCase();
  return orders.filter((o) => {
    if (opts.status !== 'All' && o.status !== opts.status) return false;
    if (!q) return true;
    return [o.id, o.recipient, o.city, o.address, o.tripId].some((f) => f.toLowerCase().includes(q));
  });
}

export function filterTrips(trips: Trip[], status: TripStatus | 'All'): Trip[] {
  return trips
    .filter((t) => status === 'All' || t.status === status)
    .sort((a, b) => b.date.localeCompare(a.date) || a.scheduledStart.localeCompare(b.scheduledStart));
}

export type HistoryRange = '3d' | '7d' | 'all';

export function withinRange(dateKey: string, todayKey: string, range: HistoryRange): boolean {
  if (range === 'all') return true;
  const age = diffDays(dateKey, todayKey);
  return age >= 0 && age < (range === '3d' ? 3 : 7);
}

/** Order yang harus dikerjakan berikutnya: yang sedang berjalan, atau stop pertama yang masih Ditugaskan. */
export function nextOrderForTrip(orders: DeliveryOrder[], tripId: string): DeliveryOrder | undefined {
  const stops = ordersOfTrip(orders, tripId);
  return stops.find((o) => o.status === 'In Transit') ?? stops.find((o) => o.status === 'Assigned');
}
