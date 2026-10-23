import type { AnyStatus, Priority } from '../types/index.ts';

export const STATUS_LABEL: Record<AnyStatus, string> = {
  Assigned: 'Ditugaskan',
  'In Progress': 'Berjalan',
  'In Transit': 'Dalam perjalanan',
  Completed: 'Selesai',
  Delivered: 'Terkirim',
  Failed: 'Gagal',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  High: 'Prioritas tinggi',
  Normal: 'Normal',
  Low: 'Rendah',
};
