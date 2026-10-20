import { useColorScheme } from 'react-native';
import type { Trend } from './series';

// 漲跌燈號顏色（台灣習慣：漲紅、跌綠），淺色與深色模式共用
const status = {
  up: '#d03b3b',
  flat: '#fab219',
  down: '#0ca30c',
};

const light = {
  bg: '#F4F5F7',
  card: '#FCFCFB',
  text: '#0B0B0B',
  muted: '#52514E',
  faint: '#8A8985',
  border: '#E5E4E0',
  grid: '#ECEBE7',
  accent: '#2A78D6',
  chip: '#EEF2FF',
  iconBg: '#F1F0EC',
  ...status,
};

const dark: typeof light = {
  bg: '#0F0F0E',
  card: '#1A1A19',
  text: '#F0EFEC',
  muted: '#C3C2B7',
  faint: '#8E8D86',
  border: '#2E2E2B',
  grid: '#2A2A27',
  accent: '#3987E5',
  chip: '#1E2A44',
  iconBg: '#262624',
  ...status,
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const TREND_LABEL: Record<Trend, { icon: string; label: string }> = {
  up: { icon: '▲', label: '漲' },
  flat: { icon: '●', label: '持平' },
  down: { icon: '▼', label: '跌' },
};
