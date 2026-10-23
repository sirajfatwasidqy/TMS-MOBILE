import { DEMO_ACCOUNT } from '../constants/domain.ts';
import { DRIVER } from '../data/fixtures.ts';
import type { Driver } from '../types/index.ts';

export interface LoginErrors {
  driverId?: string;
  password?: string;
}

export function validateLogin(driverId: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const id = driverId.trim();
  if (!id) errors.driverId = 'Masukkan ID driver.';
  else if (!/^[A-Za-z0-9._-]{4,20}$/.test(id)) errors.driverId = 'ID driver 4–20 karakter: huruf, angka, titik, garis bawah, atau strip.';
  if (!password) errors.password = 'Masukkan kata sandi.';
  else if (password.length < 6) errors.password = 'Kata sandi minimal 6 karakter.';
  return errors;
}

/**
 * Pemeriksaan khusus demo terhadap akun yang ditulis langsung di kode. Tidak ada backend,
 * jadi ini BUKAN autentikasi sungguhan dan tidak boleh dipakai apa adanya di produksi.
 */
export function authenticate(driverId: string, password: string): Driver | null {
  const matches =
    driverId.trim().toUpperCase() === DEMO_ACCOUNT.driverId && password === DEMO_ACCOUNT.password;
  return matches ? DRIVER : null;
}
