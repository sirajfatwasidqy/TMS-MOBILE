import type { AnyStatus } from '@/types';

import { STATUS_LABEL } from './labels';

export const colors = {
  navy900: '#0A1F3C',
  navy700: '#14325C',
  navy500: '#2B4F83',
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  border: '#DCE2EC',
  text: '#0F1B2D',
  textMuted: '#58657A',
  textOnNavy: '#FFFFFF',
  textOnNavyMuted: '#B4C2D9',
  blue: '#1F6FEB',
  green: '#1B8A57',
  orange: '#C86A0A',
  red: '#C0352B',
  blueBg: '#E5EFFE',
  greenBg: '#E2F4EA',
  orangeBg: '#FDEEDB',
  redBg: '#FBE6E4',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

export const font = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  small: { fontSize: 14, color: colors.textMuted },
  caption: { fontSize: 13, color: colors.textMuted },
};

/** Satu pemetaan untuk semua status, supaya warna konsisten di seluruh aplikasi. */
export const statusStyle: Record<AnyStatus, { fg: string; bg: string; label: string }> = {
  Assigned: { fg: colors.orange, bg: colors.orangeBg, label: STATUS_LABEL.Assigned },
  'In Progress': { fg: colors.blue, bg: colors.blueBg, label: STATUS_LABEL['In Progress'] },
  'In Transit': { fg: colors.blue, bg: colors.blueBg, label: STATUS_LABEL['In Transit'] },
  Completed: { fg: colors.green, bg: colors.greenBg, label: STATUS_LABEL.Completed },
  Delivered: { fg: colors.green, bg: colors.greenBg, label: STATUS_LABEL.Delivered },
  Failed: { fg: colors.red, bg: colors.redBg, label: STATUS_LABEL.Failed },
};
