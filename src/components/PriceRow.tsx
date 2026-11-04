// 精簡的一行一項（菜價、水果、魚貨、肉蛋用）：點一下才展開近 8 週走勢
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CandleChart } from './CandleChart';
import { ItemIcon } from './ItemIcon';
import { perKg, trendOf, type PriceItem } from '@/lib/series';
import { TREND_LABEL, useTheme } from '@/lib/theme';

export function PriceRow({ item }: { item: PriceItem }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const trend = trendOf(item.changePct, item.threshold);
  const pct = item.changePct ?? 0;
  const kg = perKg(item, item.price);

  return (
    <View style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${item.name} ${item.price} ${item.unit}，${TREND_LABEL[trend].label}，比上週 ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%。${open ? '收起' : '展開'}走勢圖`}
        style={styles.main}>
        <ItemIcon item={item} size={26} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: t.text }]} role="heading" aria-level={3} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ color: t.muted, fontSize: 13, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
            <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{item.price.toFixed(1)}</Text> {item.unit}
            {kg != null ? `・≈ ${kg.toFixed(1)} 元/公斤` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <View style={[styles.light, { borderColor: t[trend] }]}>
            <View style={[styles.dot, { backgroundColor: t[trend] }]} />
            <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>
              {TREND_LABEL[trend].icon} {TREND_LABEL[trend].label}
            </Text>
          </View>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {pct > 0 ? '+' : ''}
            {pct.toFixed(1)}%
          </Text>
        </View>
        <Text style={{ color: t.faint, fontSize: 14, width: 14, textAlign: 'center' }}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <View style={{ paddingTop: 4 }}>
          <CandleChart candles={item.candles} digits={1} name={item.name} unit={item.unit} height={80} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  name: { fontSize: 15, fontWeight: '700' },
  light: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
