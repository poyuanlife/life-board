import { StyleSheet, Text, View } from 'react-native';
import { ItemIcon } from './ItemIcon';
import { perKg, SHOPPING, vsAverage, type PriceItem } from '@/lib/series';
import { useTheme } from '@/lib/theme';

const CHEAP = -15; // 比近 8 週平均便宜 15% 以上 → 划算
const PRICEY = 20; // 貴 20% 以上 → 偏貴

type Row = { item: PriceItem; diff: number };

// 本週划算推薦：拿目前價格跟最近 8 週平均比，找出特別便宜、特別貴的
export function BargainCard({ items }: { items: PriceItem[] }) {
  const t = useTheme();
  const rows: Row[] = items
    .filter((i) => SHOPPING.includes(i.category))
    .map((item) => ({ item, diff: vsAverage(item) }))
    .filter((r): r is Row => r.diff != null);

  const cheap = rows.filter((r) => r.diff <= CHEAP).sort((a, b) => a.diff - b.diff).slice(0, 6);
  const pricey = rows.filter((r) => r.diff >= PRICEY).sort((a, b) => b.diff - a.diff).slice(0, 4);
  if (!cheap.length && !pricey.length) return null;

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={{ gap: 2 }}>
        <Text style={[styles.title, { color: t.text }]}>🛒 本週划算推薦</Text>
        <Text style={{ color: t.faint, fontSize: 12 }}>目前價格與最近 8 週平均相比</Text>
      </View>
      <View style={styles.cols}>
        <Column title="比平常便宜，適合多買" rows={cheap} tone="down" empty="這週沒有特別便宜的品項" />
        <Column title="比平常貴，可以先少買" rows={pricey} tone="up" empty="這週沒有特別貴的品項" />
      </View>
    </View>
  );
}

function Column({ title, rows, tone, empty }: { title: string; rows: Row[]; tone: 'up' | 'down'; empty: string }) {
  const t = useTheme();
  return (
    <View style={styles.col}>
      <View style={styles.colHead}>
        <View style={[styles.dot, { backgroundColor: t[tone] }]} />
        <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{title}</Text>
      </View>
      {rows.length === 0 && <Text style={{ color: t.faint, fontSize: 13 }}>{empty}</Text>}
      {rows.map(({ item, diff }) => (
        <View key={item.id} style={styles.row}>
          <ItemIcon item={item} size={24} />
          <Text style={{ color: t.text, flex: 1 }}>{item.name}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: t.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>
              {item.price.toFixed(1)} {item.unit}
            </Text>
            {perKg(item, item.price) != null && (
              <Text style={{ color: t.faint, fontSize: 11, fontVariant: ['tabular-nums'] }}>
                ≈ {perKg(item, item.price)!.toFixed(1)} 元/公斤
              </Text>
            )}
          </View>
          <Text style={[styles.diff, { color: t.text }]}>
            {diff < 0 ? '▼ 便宜' : '▲ 貴'} {Math.abs(diff).toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  title: { fontSize: 17, fontWeight: '700' },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  col: { flexGrow: 1, flexBasis: 280, gap: 8 },
  colHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diff: { minWidth: 72, textAlign: 'right', fontWeight: '600', fontVariant: ['tabular-nums'] },
});
