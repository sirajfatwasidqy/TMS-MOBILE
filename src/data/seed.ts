import type {
  Activity,
  AppData,
  DeliveryOrder,
  OrderStatus,
  Priority,
  Trip,
  TripStatus,
} from '../types/index.ts';
import { addDays, toDateKey } from '../utils/date.ts';

interface OrderSpec {
  recipient: string;
  address: string;
  city: string;
  items: [number, string];
  weightKg: number;
  priority: Priority;
  outcome: OrderStatus;
  receivedBy?: string;
  failureReason?: string;
  proof?: boolean;
}

interface TripSpec {
  dayOffset: number;
  vehicleId: string;
  destination: string;
  start: string;
  end: string;
  distanceKm: number;
  status: TripStatus;
  orders: OrderSpec[];
}

const HUB = 'Hub Cakung';
const MINUTE = 60_000;

const SPECS: TripSpec[] = [
  {
    dayOffset: 0, vehicleId: 'VEH-01', destination: 'Bekasi - Cikarang', start: '07:30', end: '12:00', distanceKm: 38, status: 'In Progress',
    orders: [
      { recipient: 'Toko Bangunan Sumber Rejeki', address: 'Jl. Contoh Raya No. 12', city: 'Bekasi', items: [24, 'Semen sak 40 kg'], weightKg: 960, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Pak Hendra' },
      { recipient: 'CV Mitra Kemasan Nusantara', address: 'Kawasan Industri Demo, Blok C-7', city: 'Cikarang', items: [60, 'Kardus lipat'], weightKg: 310, priority: 'High', outcome: 'In Transit' },
      { recipient: 'Apotek Sehat Sentosa', address: 'Jl. Percobaan No. 3', city: 'Bekasi', items: [12, 'Karton perlengkapan medis'], weightKg: 85, priority: 'High', outcome: 'Assigned' },
    ],
  },
  {
    dayOffset: 0, vehicleId: 'VEH-01', destination: 'Jakarta Timur', start: '13:30', end: '17:00', distanceKm: 26, status: 'Assigned',
    orders: [
      { recipient: 'Warung Kopi Senja Raya', address: 'Jl. Latihan No. 21', city: 'Jakarta Timur', items: [8, 'Karung biji kopi 25 kg'], weightKg: 200, priority: 'Normal', outcome: 'Assigned' },
      { recipient: 'PT Karya Mandiri Demo', address: 'Jl. Simulasi, Blok B-4', city: 'Jakarta Timur', items: [15, 'Peti suku cadang'], weightKg: 420, priority: 'Low', outcome: 'Assigned' },
    ],
  },
  {
    dayOffset: 1, vehicleId: 'VEH-01', destination: 'Cibitung', start: '08:00', end: '12:00', distanceKm: 29, status: 'Assigned',
    orders: [
      { recipient: 'Pabrik Plastik Contoh', address: 'Kawasan Industri Demo, Blok A-2', city: 'Cibitung', items: [35, 'Karung resin 25 kg'], weightKg: 875, priority: 'High', outcome: 'Assigned' },
      { recipient: 'Toko Cat Warna Warni', address: 'Jl. Uji Coba No. 8', city: 'Cibitung', items: [22, 'Ember cat'], weightKg: 330, priority: 'Normal', outcome: 'Assigned' },
    ],
  },
  {
    dayOffset: -1, vehicleId: 'VEH-01', destination: 'Tangerang', start: '08:00', end: '13:00', distanceKm: 52, status: 'Completed',
    orders: [
      { recipient: 'Minimarket Harapan Baru', address: 'Jl. Contoh Indah No. 5', city: 'Tangerang', items: [30, 'Karton minuman'], weightKg: 540, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Ibu Sari' },
      { recipient: 'Toko Elektronik Cahaya Demo', address: 'Jl. Percobaan Raya No. 40', city: 'Tangerang', items: [6, 'Kotak peralatan elektronik'], weightKg: 180, priority: 'High', outcome: 'Delivered', receivedBy: 'Pak Doni', proof: true },
      { recipient: 'Klinik Pratama Contoh', address: 'Jl. Latihan Selatan No. 9', city: 'Tangerang Selatan', items: [10, 'Karton perlengkapan medis'], weightKg: 70, priority: 'Normal', outcome: 'Failed', failureReason: 'Penerima tidak ada di tempat' },
    ],
  },
  {
    dayOffset: -1, vehicleId: 'VEH-02', destination: 'Depok', start: '14:00', end: '17:30', distanceKm: 44, status: 'Completed',
    orders: [
      { recipient: 'Bengkel Motor Maju Demo', address: 'Jl. Simulasi No. 17', city: 'Depok', items: [20, 'Karton oli pelumas'], weightKg: 360, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Mas Rudi' },
      { recipient: 'Perpustakaan Komunitas Contoh', address: 'Jl. Uji Coba No. 2', city: 'Depok', items: [14, 'Karton buku'], weightKg: 150, priority: 'Low', outcome: 'Delivered', receivedBy: 'Ibu Wati' },
    ],
  },
  {
    dayOffset: -2, vehicleId: 'VEH-01', destination: 'Bogor', start: '07:00', end: '13:00', distanceKm: 61, status: 'Completed',
    orders: [
      { recipient: 'Rumah Makan Padang Contoh', address: 'Jl. Demo Raya No. 31', city: 'Bogor', items: [18, 'Karung beras 25 kg'], weightKg: 450, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Uda Reza' },
      { recipient: 'Toko Peralatan Tani Demo', address: 'Jl. Percobaan Timur No. 6', city: 'Bogor', items: [12, 'Karung pupuk 50 kg'], weightKg: 600, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Pak Slamet' },
      { recipient: 'SD Contoh Harapan', address: 'Jl. Latihan Barat No. 14', city: 'Bogor', items: [9, 'Karton alat tulis'], weightKg: 95, priority: 'Low', outcome: 'Delivered', receivedBy: 'Ibu Dewi' },
    ],
  },
  {
    dayOffset: -3, vehicleId: 'VEH-01', destination: 'Karawang', start: '08:30', end: '14:00', distanceKm: 70, status: 'Failed',
    orders: [
      { recipient: 'Gudang Sementara Demo', address: 'Jl. Simulasi Utara No. 1', city: 'Karawang', items: [40, 'Palet plastik'], weightKg: 520, priority: 'Normal', outcome: 'Failed', failureReason: 'Alamat tidak ditemukan' },
      { recipient: 'Toko Kain Indah Contoh', address: 'Jl. Uji Coba Raya No. 23', city: 'Karawang', items: [25, 'Gulungan kain'], weightKg: 300, priority: 'Normal', outcome: 'Failed', failureReason: 'Penerima menolak barang' },
    ],
  },
  {
    dayOffset: -4, vehicleId: 'VEH-02', destination: 'Jakarta Selatan', start: '09:00', end: '12:30', distanceKm: 33, status: 'Completed',
    orders: [
      { recipient: 'Kafe Roti Pagi Demo', address: 'Jl. Contoh Selatan No. 11', city: 'Jakarta Selatan', items: [10, 'Karung tepung 25 kg'], weightKg: 250, priority: 'Normal', outcome: 'Delivered', receivedBy: 'Mbak Intan' },
      { recipient: 'Butik Mode Contoh', address: 'Jl. Percobaan Indah No. 7', city: 'Jakarta Selatan', items: [5, 'Karton pakaian'], weightKg: 60, priority: 'Low', outcome: 'Delivered', receivedBy: 'Mbak Lina' },
    ],
  },
];

function stamp(base: Date, dayOffset: number, hhmm: string, plusMin: number): string {
  const d = addDays(base, dayOffset);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m + plusMin, 0, 0);
  return d.toISOString();
}

/**
 * Membuat dataset sintetis relatif terhadap `now`, sehingga "hari ini" selalu punya trip aktif.
 * Fungsi murni: `now` yang sama selalu menghasilkan data yang sama.
 */
export function createSeedData(now: Date): AppData {
  const trips: Trip[] = [];
  const orders: DeliveryOrder[] = [];
  const activities: Activity[] = [];
  const tripCounter: Record<string, number> = {};
  const orderCounter: Record<string, number> = {};
  let actSeq = 0;

  const log = (a: Omit<Activity, 'id'>) => {
    actSeq += 1;
    activities.push({ id: `ACT-${String(actSeq).padStart(3, '0')}`, ...a });
  };

  for (const spec of SPECS) {
    const date = toDateKey(addDays(now, spec.dayOffset));
    const compact = date.slice(2).replace(/-/g, '');
    tripCounter[compact] = (tripCounter[compact] ?? 0) + 1;
    const tripId = `TRP-${compact}-${String(tripCounter[compact]).padStart(2, '0')}`;
    const live = spec.dayOffset === 0 && spec.status === 'In Progress';

    // Trip yang sedang berjalan memakai waktu relatif terhadap "sekarang"; lainnya memakai jam tetap pada harinya.
    const at = (hhmm: string, plus: number): string =>
      live ? new Date(now.getTime() + plus * MINUTE).toISOString() : stamp(now, spec.dayOffset, hhmm, plus);
    const liveTripStart = -150;
    const liveOrderStart = [-125, -20];

    const trip: Trip = {
      id: tripId, date, vehicleId: spec.vehicleId, origin: HUB, destination: spec.destination,
      scheduledStart: spec.start, scheduledEnd: spec.end, distanceKm: spec.distanceKm, status: spec.status,
    };
    if (spec.status !== 'Assigned') {
      trip.startedAt = at(spec.start, live ? liveTripStart : 12);
      log({ at: trip.startedAt, kind: 'trip_started', message: `Memulai ${tripId} menuju ${spec.destination}`, tripId });
    }

    let lastEvent = trip.startedAt;
    spec.orders.forEach((o, i) => {
      orderCounter[compact] = (orderCounter[compact] ?? 0) + 1;
      const id = `DO-${compact}-${String(orderCounter[compact]).padStart(3, '0')}`;
      const order: DeliveryOrder = {
        id, tripId, sequence: i + 1, recipient: o.recipient, address: o.address, city: o.city,
        itemCount: o.items[0], itemSummary: o.items[1], weightKg: o.weightKg, priority: o.priority, status: o.outcome,
      };
      if (o.outcome !== 'Assigned') {
        order.startedAt = at(spec.start, live ? liveOrderStart[i] : 30 + i * 55);
        log({ at: order.startedAt, kind: 'order_started', message: `Memulai pengiriman ${id} ke ${o.recipient}`, tripId, orderId: id });
        lastEvent = order.startedAt;
      }
      if (o.outcome === 'Delivered') {
        order.completedAt = new Date(new Date(order.startedAt as string).getTime() + (live ? 30 : 25) * MINUTE).toISOString();
        order.receivedBy = o.receivedBy;
        if (o.proof) order.proofCapturedAt = order.completedAt;
        log({ at: order.completedAt, kind: 'order_delivered', message: `${id} terkirim, diterima oleh ${o.receivedBy}`, tripId, orderId: id });
        lastEvent = order.completedAt;
      } else if (o.outcome === 'Failed') {
        order.completedAt = new Date(new Date(order.startedAt as string).getTime() + 20 * MINUTE).toISOString();
        order.failureReason = o.failureReason;
        log({ at: order.completedAt, kind: 'order_failed', message: `${id} gagal: ${o.failureReason}`, tripId, orderId: id });
        lastEvent = order.completedAt;
      }
      orders.push(order);
    });

    if (spec.status === 'Completed' || spec.status === 'Failed') {
      trip.completedAt = new Date(new Date(lastEvent as string).getTime() + 10 * MINUTE).toISOString();
      log({
        at: trip.completedAt,
        kind: spec.status === 'Completed' ? 'trip_completed' : 'trip_failed',
        message: spec.status === 'Completed' ? `${tripId} selesai` : `${tripId} berakhir tanpa pengiriman yang berhasil`,
        tripId,
      });
    }
    trips.push(trip);
  }

  activities.sort((a, b) => b.at.localeCompare(a.at));
  return { trips, orders, activities, seededOn: toDateKey(now) };
}
