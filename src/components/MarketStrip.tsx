// 首頁「市場快覽」：投資的人最常看的 6 個數字，一眼看完
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ItemIcon } from './ItemIcon';
import { MARKET, trendOf, type PriceItem } from '@/lib/series';
import { TREND_LABEL, useTheme } from '@/lib/theme';

const PICKS = ['taiex', 'sox', 'usd', 'gold', 'fuel92', 'brent'];

/** 2026-11-04 → 11/4 */
export const shortDate = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;

/** 金融類看「比前一天」，其他看「比上週」 */
export function changeOf(item: PriceItem) {
  if (MARKET.includes(item.category) && item.day) return { pct: item.day.pct, since: '前一天' };
  return { pct: item.changePct ?? 0, since: '上週' };
}

export function fmtPrice(item: PriceItem) {
  const digits = item.category === 'fx' || item.category === 'stock' ? 2 : item.category === 'gold' || item.category === 'metal' ? 0 : 1;
  return item.price.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function MarketStrip({ items, columns, menu }: { items: PriceItem[]; columns: number; menu?: ReactNode }) {
  const t = useTheme();
  const list = PICKS.map((id) => items.find((i) => i.id === id)).filter((i): i is PriceItem => !!i);
  if (!list.length) return null;
  const cols = columns >= 3 ? 6 : columns === 2 ? 3 : 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={[styles.h2, { color: t.text }]} role="heading" aria-level={2}>
          📊 市場快覽
        </Text>
        <Text style={{ color: t.faint, fontSize: 13, flex: 1, minWidth: 160 }}>股市、匯率、金價、原油和前一天比，油價和上週比</Text>
        {menu}
      </View>
      <View style={[styles.grid, { marginHorizontal: -4, rowGap: 8 }]}>
        {list.map((item) => {
          const { pct, since } = changeOf(item);
          const trend = trendOf(pct, item.threshold);
          return (
            <View key={item.id} style={{ width: `${100 / cols}%`, paddingHorizontal: 4 }}>
              <View
                style={[styles.tile, { backgroundColor: t.card, borderColor: t.border }]}
                role="group"
                aria-label={`${item.name} ${fmtPrice(item)} ${item.unit}，比${since} ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}>
                <View style={styles.tileTop}>
                  <ItemIcon item={item} size={26} />
                  <Text style={{ color: t.muted, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.value, { color: t.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {fmtPrice(item)}
                </Text>
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  <Text style={{ color: t[trend] }}>{TREND_LABEL[trend].icon}</Text> {pct > 0 ? '+' : ''}
                  {pct.toFixed(1)}%
                  <Text style={{ color: t.faint, fontWeight: '400', fontSize: 12 }}> 比{since}</Text>
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  h2: { fontSize: 19, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  tileTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
