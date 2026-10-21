import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { PROTEIN_SOURCES } from '@/lib/exchange';
import { KG_PER_CATTY, type PricesResponse } from '@/lib/series';
import { useTheme } from '@/lib/theme';
import { Panel } from './ui';

const BASE_URL = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
const CATTY_G = KG_PER_CATTY * 1000;

/** 用看板上的今日價格，算出「1 份蛋白質（7 公克）要花多少錢」 */
export function ProteinValue() {
  const t = useTheme();
  const [data, setData] = useState<PricesResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/data/prices.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  const rows = PROTEIN_SOURCES.flatMap((s) => {
    const item = data?.items.find((i) => i.id === s.id && i.unit === '元/台斤');
    if (!item || !(item.price > 0)) return [];
    const cost = (item.price / CATTY_G) * s.grams;
    return [{ ...s, name: item.name, icon: item.icon, price: item.price, cost }];
  }).sort((a, b) => a.cost - b.cost);
  const max = rows.length ? rows[rows.length - 1].cost : 1;

  return (
    <Panel title="💰 蛋白質 CP 值排行" right={<Text style={{ color: t.faint, fontSize: 12 }}>依今日價格自動更新</Text>}>
      {failed && <Text style={{ color: t.faint }}>今天的價格資料暫時讀不到，請稍後再試。</Text>}
      {!data && !failed && <Text style={{ color: t.faint }}>載入價格中…</Text>}
      {rows.map((r, i) => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.rank, { color: i < 3 ? t.accent : t.faint }]}>{i + 1}</Text>
          <View style={{ width: 120 }}>
            <Text style={{ color: t.text, fontWeight: '600' }}>
              {r.icon} {r.name}
            </Text>
            <Text style={{ color: t.faint, fontSize: 11 }}>1 份 ≈ {r.serving}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={[styles.track, { backgroundColor: t.grid }]}>
              <View style={{ width: `${(r.cost / max) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: i < 3 ? t.down : t.faint }} />
            </View>
            <Text style={{ color: t.faint, fontSize: 11 }}>100 元約可買 {Math.round((100 / r.cost) * 7)} 公克蛋白質</Text>
          </View>
          <Text style={[styles.cost, { color: t.text }]}>{r.cost.toFixed(1)} 元</Text>
        </View>
      ))}
      <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
        右邊是「1 份蛋白質（約 7 公克）」大約要花多少錢，越便宜越划算。價格用的是首頁的產地／批發價，並扣掉骨頭、殼等不能吃的部分估算；市場和超市的零售價通常是 1.5～3 倍，適合用來比較哪個比較划算，不是實際售價。
      </Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { width: 18, textAlign: 'center', fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  cost: { width: 60, textAlign: 'right', fontWeight: '700', fontVariant: ['tabular-nums'] },
});
