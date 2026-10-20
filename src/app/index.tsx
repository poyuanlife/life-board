import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';
import { PriceCard } from '@/components/PriceCard';
import { PriceGauge } from '@/components/PriceGauge';
import type { Category, PricesResponse } from '@/lib/series';
import { useTheme } from '@/lib/theme';
import Constants from 'expo-constants';

// 網站放在子路徑時（例如 GitHub Pages 的 /專案名），資料檔也要加上這段路徑
const BASE_URL = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');

const SECTIONS: { key: Category; title: string; hint: string }[] = [
  { key: 'veg', title: '🥬 蔬果', hint: '農業部・台北一市場批發價（零售價約為 2～3 倍）' },
  { key: 'meat', title: '🥩 肉品・雞蛋', hint: '農業部・產地/拍賣價' },
  { key: 'fuel', title: '⛽ 油價', hint: '中油牌價・每週一調整' },
  { key: 'fx', title: '💱 匯率', hint: '國際中間價，換匯請以銀行牌告為準・不計入溫度計' },
];

function today() {
  const d = new Date();
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${w}）`;
}

export default function Home() {
  const t = useTheme();
  // 用實際量到的內容寬度決定欄數（手機 1 欄 → 電腦最多 4 欄）
  const [inner, setInner] = useState(0);
  const columns = inner >= 1180 ? 4 : inner >= 860 ? 3 : inner >= 540 ? 2 : 1;
  const gap = 12;
  const [data, setData] = useState<PricesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetch(`${BASE_URL}/data/prices.json`)
      .then((r) => {
        if (!r.ok) throw new Error('還沒有物價資料，請先執行 npm run fetch-prices');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);
  useEffect(load, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Head>
        <title>生活物價看板</title>
      </Head>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inner} onLayout={(e) => setInner(e.nativeEvent.layout.width - 32)}>
          <View style={styles.header}>
            <Text style={[styles.h1, { color: t.text }]}>生活物價看板</Text>
            <Text style={{ color: t.muted }}>{today()}</Text>
          </View>

          {!data && !error && (
            <View style={styles.loading}>
              <ActivityIndicator />
              <Text style={{ color: t.muted }}>載入中…</Text>
            </View>
          )}
          {error && (
            <Pressable onPress={load}>
              <Text style={{ color: t.up }}>讀取失敗：{error}（點這裡重試）</Text>
            </Pressable>
          )}

          {data && (
            <>
              <PriceGauge items={data.items} />
              {data.errors.length > 0 && (
                <Text style={{ color: t.muted, fontSize: 12 }}>⚠️ 部分資料暫時抓不到：{data.errors.join('；')}</Text>
              )}

              {SECTIONS.map((s) => {
                const list = data.items.filter((i) => i.category === s.key);
                if (!list.length) return null;
                return (
                  <View key={s.key} style={styles.section}>
                    <View style={styles.sectionHead}>
                      <Text style={[styles.h2, { color: t.text }]}>{s.title}</Text>
                      <Text style={{ color: t.faint, fontSize: 12, flexShrink: 1 }}>{s.hint}</Text>
                    </View>
                    <View style={[styles.grid, { marginHorizontal: -gap / 2, rowGap: gap }]}>
                      {list.map((item) => (
                        <View key={item.id} style={{ width: `${100 / columns}%`, paddingHorizontal: gap / 2 }}>
                          <PriceCard item={item} />
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}

              <Text style={[styles.footer, { color: t.faint }]}>
                燈號：🔴 漲・🟡 持平・🟢 跌（菜價 ±5%、肉蛋 ±3%、匯率 ±1% 以內算持平）{'\n'}
                K 線：每根代表一週，開盤 = 上週收盤，紅 = 收盤比開盤高，綠 = 比開盤低。點或滑過 K 棒可看明細。{'\n'}
                資料更新：{new Date(data.updatedAt).toLocaleString('zh-TW')}（每天早上自動更新）
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', paddingVertical: 20 },
  inner: { gap: 20, width: '100%', maxWidth: 1320, paddingHorizontal: 16 },
  header: { gap: 4 },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 19, fontWeight: '700' },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { fontSize: 12, lineHeight: 20, marginTop: 8 },
});
