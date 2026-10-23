export type TripStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Failed';
export type OrderStatus = 'Assigned' | 'In Transit' | 'Delivered' | 'Failed';
export type AnyStatus = TripStatus | OrderStatus;
export type Priority = 'High' | 'Normal' | 'Low';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  depot: string;
  licenseClass: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacityKg: number;
  lastServiceDate: string;
}

export interface Trip {
  id: string;
  /** Tanggal kalender lokal, YYYY-MM-DD. */
  date: string;
  vehicleId: string;
  origin: string;
  destination: string;
  /** Jendela waktu rencana, HH:mm. */
  scheduledStart: string;
  scheduledEnd: string;
  distanceKm: number;
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface DeliveryOrder {
  id: string;
  tripId: string;
  /** Urutan stop dalam trip, dimulai dari 1. */
  sequence: number;
  recipient: string;
  address: string;
  city: string;
  itemCount: number;
  itemSummary: string;
  weightKg: number;
  priority: Priority;
  status: OrderStatus;
  startedAt?: string;
  completedAt?: string;
  receivedBy?: string;
  note?: string;
  failureReason?: string;
  /** Terisi saat placeholder bukti pengiriman (simulasi) diambil. */
  proofCapturedAt?: string;
}

export type ActivityKind =
  | 'trip_started'
  | 'trip_completed'
  | 'trip_failed'
  | 'order_started'
  | 'order_delivered'
  | 'order_failed';

export interface Activity {
  id: string;
  at: string;
  kind: ActivityKind;
  message: string;
  tripId: string;
  orderId?: string;
}

export interface AppData {
  trips: Trip[];
  orders: DeliveryOrder[];
  activities: Activity[];
  /** Tanggal data demo dibuat (YYYY-MM-DD). */
  seededOn: string;
}

export interface Settings {
  priorityFirst: boolean;
}
