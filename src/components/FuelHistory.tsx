import { StyleSheet, Text, View } from 'react-native';
import { dayNum, type PriceChange } from '@/lib/series';
import { useTheme } from '@/lib/theme';

const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
const WEEK_LABEL = ['本週', '上週', '上上週', '3 週前'];

// 油價卡片下半部：最近 4 週牌價 + 最近幾次調價紀錄（取代 K 線，因為油價多數週不變）
export function FuelHistory({ weeks, adjustments }: { weeks: PriceChange[]; adjustments: PriceChange[] }) {
  const t = useTheme();
  const last = adjustments[0];
  const frozenWeeks = last && weeks[0] ? Math.round((dayNum(weeks[0].date) - dayNum(last.date)) / 7) : 0;

  const changeText = (c: number) => (c === 0 ? '不變' : `${c > 0 ? '▲ 漲' : '▼ 降'} ${Math.abs(c).toFixed(1)}`);
  const changeColor = (c: number) => (c === 0 ? t.faint : c > 0 ? t.up : t.down);

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.table, { borderColor: t.border }]}>
        {weeks.map((w, i) => (
          <View key={w.date} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }]}>
            <Text style={[styles.label, { color: i === 0 ? t.text : t.muted, fontWeight: i === 0 ? '700' : '400' }]}>
              {WEEK_LABEL[i]}
            </Text>
            <Text style={[styles.date, { color: t.faint }]}>{md(w.date)}</Text>
            <Text style={[styles.price, { color: t.text }]}>{w.price.toFixed(1)}</Text>
            <View style={styles.changeCell}>
              {w.change !== 0 && <View style={[styles.dot, { backgroundColor: changeColor(w.change) }]} />}
              <Text style={[styles.change, { color: w.change === 0 ? t.faint : t.text }]}>{changeText(w.change)}</Text>
            </View>
          </View>
        ))}
      </View>

      {last && (
        <View style={[styles.adjBox, { backgroundColor: t.iconBg }]}>
          <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }}>
            {frozenWeeks > 0 ? `已連續 ${frozenWeeks} 週不變` : '本週有調整'}
          </Text>
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
            最近調價：
            {adjustments
              .map((a) => `${md(a.date)} ${a.change > 0 ? '漲' : '降'} ${Math.abs(a.change).toFixed(1)}`)
              .join('・')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, gap: 8 },
  label: { width: 52, fontSize: 13 },
  date: { width: 40, fontSize: 12, fontVariant: ['tabular-nums'] },
  price: { flex: 1, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  changeCell: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 70, justifyContent: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  change: { fontSize: 13, fontVariant: ['tabular-nums'] },
  adjBox: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
});
