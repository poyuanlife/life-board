import { StyleSheet, Text, View } from 'react-native';
import { ItemIcon } from './ItemIcon';
import { CandleChart } from './CandleChart';
import { changeOf, shortDate } from './MarketStrip';
import { perKg, trendOf, type PriceItem } from '@/lib/series';
import { TREND_LABEL, useTheme } from '@/lib/theme';

export function PriceCard({ item }: { item: PriceItem }) {
  const t = useTheme();
  // 金融類看「比前一天」，其他看「比上週」；燈號跟著同一個數字
  const { pct, since } = changeOf(item);
  const trend = trendOf(pct, item.threshold);
  // 匯率看到小數 2 位、金價取整數，其他 1 位
  const digits = item.category === 'fx' || item.category === 'stock' ? 2 : item.category === 'gold' || item.category === 'metal' ? 0 : 1;
  const week = item.changePct ?? 0;
  const kg = perKg(item, item.price); // 食物：主價格是台斤，旁邊補上公斤
  // 匯率說「變貴／變便宜」比「漲／跌」好懂（數字是台幣換 1 單位外幣）
  const label = item.category === 'fx' && trend !== 'flat' ? (trend === 'up' ? '變貴' : '變便宜') : TREND_LABEL[trend].label;

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: t.iconBg }]}>
          <ItemIcon item={item} size={item.category === 'fuel' ? 44 : 32} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.text }]} role="heading" aria-level={3}>
            {item.name}
          </Text>
          {item.note && <Text style={{ color: t.faint, fontSize: 12 }}>{item.note}</Text>}
        </View>
        {/* 紅綠燈：顏色 + 圖示 + 文字，不只靠顏色 */}
        <View style={[styles.light, { borderColor: t[trend] }]}>
          <View style={[styles.dot, { backgroundColor: t[trend] }]} />
          <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>
            {TREND_LABEL[trend].icon} {label}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={[styles.price, { color: t.text }]}>
          {item.price.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
        </Text>
        <Text style={{ color: t.muted, fontSize: 13 }}>{item.unit}</Text>
        {kg != null && (
          <Text style={[styles.catty, { color: t.muted, backgroundColor: t.iconBg }]}>
            ≈ {kg.toFixed(1)} 元/公斤
          </Text>
        )}
        <Text style={[styles.pct, { color: t.text }]}>
          <Text style={{ color: t.muted, fontSize: 12, fontWeight: '400' }}>比{since} </Text>
          {pct > 0 ? '+' : ''}
          {pct.toFixed(1)}%
        </Text>
      </View>
      {item.day && (
        <Text style={{ color: t.muted, fontSize: 12, marginTop: -6, fontVariant: ['tabular-nums'] }}>
          {shortDate(item.day.date)}・{item.day.change > 0 ? '+' : ''}
          {item.day.change.toLocaleString('en-US', { maximumFractionDigits: 2 })}・比上週 {week > 0 ? '+' : ''}
          {week.toFixed(1)}%
        </Text>
      )}

      <CandleChart candles={item.candles} digits={digits} name={item.name} unit={item.unit} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  light: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  catty: { fontSize: 12, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1, fontVariant: ['tabular-nums'] },
  price: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pct: { marginLeft: 'auto', fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
