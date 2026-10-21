import { Text, View } from 'react-native';
import type { PriceItem } from '@/lib/series';
import { useTheme } from '@/lib/theme';

// 油品依加油站油槍顏色：98 綠、95 黃、92 紅、柴油黑
const FUEL_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  fuel98: { label: '98', bg: '#1f9d3a', fg: '#ffffff' },
  fuel95: { label: '95', bg: '#f2c200', fg: '#1a1a1a' },
  fuel92: { label: '92', bg: '#d32f2f', fg: '#ffffff' },
  diesel: { label: '柴', bg: '#111111', fg: '#ffffff' },
};

// 價格項目的圖示：油品用色標，其他用 emoji
export function ItemIcon({ item, size }: { item: Pick<PriceItem, 'id' | 'icon'>; size: number }) {
  const t = useTheme();
  const badge = FUEL_BADGE[item.id];
  if (!badge) return <Text style={{ fontSize: size * 0.75 }}>{item.icon}</Text>;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: badge.bg,
        alignItems: 'center',
        justifyContent: 'center',
        // 深色模式下黑色柴油加一圈邊，才看得到
        borderWidth: item.id === 'diesel' ? 1 : 0,
        borderColor: t.border,
      }}
    >
      <Text style={{ color: badge.fg, fontSize: size * 0.42, fontWeight: '800' }}>{badge.label}</Text>
    </View>
  );
}
