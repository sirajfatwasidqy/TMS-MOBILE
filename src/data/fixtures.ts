import type { Driver, Vehicle } from '../types/index.ts';

// Semua data di bawah ini sintetis. Plat, nama, dan nomor telepon bukan milik orang sungguhan.
export const DRIVER: Driver = {
  id: 'RAJA123',
  name: 'Raja Pratama',
  phone: '+62 800-0000-0123',
  depot: 'Hub Cakung (depo demo)',
  licenseClass: 'SIM B2',
};

export const VEHICLES: Vehicle[] = [
  { id: 'VEH-01', plate: 'B 9142 KDL', type: 'Truk box (CDD)', capacityKg: 4000, lastServiceDate: '2026-09-18' },
  { id: 'VEH-02', plate: 'B 9306 NLL', type: 'Van kargo', capacityKg: 1200, lastServiceDate: '2026-10-02' },
];

export function getVehicle(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id);
}
