import { useColorScheme } from 'react-native';
import type { Trend } from './series';

// 漲跌燈號顏色（台灣習慣：漲紅、跌綠），淺色與深色模式共用
const status = {
  up: '#d03b3b',
  flat: '#fab219',
  down: '#0ca30c',
  // 地震震度用：3 級橘、5 弱以上紫
  quake3: '#f57c00',
  quake5: '#7b1fa2',
};

const light = {
  bg: '#F4F5F7',
  card: '#FCFCFB',
  text: '#0B0B0B',
  muted: '#52514E',
  faint: '#6E6D69', // 淺灰字，在背景與卡片上都維持 4.5:1 以上
  border: '#E5E4E0',
  grid: '#ECEBE7',
  accent: '#226BC4',
  onAccent: '#FFFFFF', // 藍色按鈕上的字
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
  onAccent: '#0B0B0B', // 深色模式的藍色按鈕較亮，用深色字才清楚
  chip: '#1E2A44',
  iconBg: '#262624',
  ...status,
};

export type Theme = typeof light;

function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** 色塊上的文字顏色：自動選白字或黑字，挑對比高的那個（例如黃色、橘色底用黑字） */
export function readableOn(bg: string) {
  const l = luminance(bg);
  return (1.05 / (l + 0.05)) >= ((l + 0.05) / 0.0555) ? '#FFFFFF' : '#111111';
}

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const TREND_LABEL: Record<Trend, { icon: string; label: string }> = {
  up: { icon: '▲', label: '漲' },
  flat: { icon: '●', label: '持平' },
  down: { icon: '▼', label: '跌' },
};
