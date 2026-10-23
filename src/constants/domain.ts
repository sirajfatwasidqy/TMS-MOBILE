export const FAILURE_REASONS = [
  'Penerima tidak ada di tempat',
  'Alamat tidak ditemukan',
  'Penerima menolak barang',
  'Akses lokasi dibatasi',
  'Lainnya',
] as const;

export const OTHER_REASON = 'Lainnya';

export type FailureReason = (typeof FAILURE_REASONS)[number];

export const LIMITS = {
  receiverMin: 3,
  receiverMax: 60,
  noteMax: 280,
  otherNoteMin: 5,
} as const;

export const DEMO_ACCOUNT = { driverId: 'RAJA123', password: '123RAJA' } as const;
export const COMPANY_NAME = 'Duta Abadi Primantara';
