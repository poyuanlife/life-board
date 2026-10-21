import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import Constants from 'expo-constants';
import { BargainCard } from '@/components/BargainCard';
import { PriceCard } from '@/components/PriceCard';
import { PriceGauge } from '@/components/PriceGauge';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import type { Category, PriceItem, PricesResponse } from '@/lib/series';
import { useTheme } from '@/lib/theme';
import { weekRange, type WeeklyArticle } from '@/lib/weekly';
import weekly from '@/content/weekly.json';

// 網站放在子路徑時，資料檔也要加上這段路徑
const BASE_URL = (Constants.expoConfig?.experiments?.baseUrl ?? '').replace(/\/$/, '');
const latest = (weekly as WeeklyArticle[])[0];

const SECTIONS: Record<Category, { title: string; hint: string }> = {
  fuel: { title: '⛽ 油價', hint: '中油牌價・每週一調整' },
  fx: { title: '💱 匯率', hint: '國際中間價，換匯請以銀行牌告為準・不計入溫度計' },
  gold: { title: '💰 金價', hint: '國際金價換算（1 錢 = 3.75 公克），銀樓買賣價另計・不計入溫度計' },
  veg: { title: '🥬 蔬菜', hint: '農業部・台北一市場批發價（零售價約為 2～3 倍）' },
  fruit: { title: '🍎 水果', hint: '農業部・台北一市場批發價' },
  fish: { title: '🐟 魚貨海鮮', hint: '農業部・全台魚市場批發價' },
  meat: { title: '🥩 肉品・雞蛋', hint: '農業部・產地/拍賣價' },
};

function today() {
  const d = new Date();
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${w}）`;
}

export function generateMetadata() {
  return meta(PAGES.home.title, PAGES.home.description);
}

export default function Home() {
  const t = useTheme();
  const [inner, setInner] = useState(0);
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

  // 依內容寬度決定欄數（手機 1 欄 → 電腦最多 4 欄）
  const columns = inner >= 1180 ? 4 : inner >= 860 ? 3 : inner >= 540 ? 2 : 1;
  const gap = 12;

  const section = (key: Category) => {
    const list = data?.items.filter((i) => i.category === key) ?? [];
    if (!list.length) return null;
    return <Section key={key} title={SECTIONS[key].title} hint={SECTIONS[key].hint} list={list} columns={columns} gap={gap} />;
  };

  return (
    <SiteLayout
      title={PAGES.home.title}
      description={PAGES.home.description}
      onWidth={setInner}>
      <View style={styles.header}>
        <Text style={[styles.h1, { color: t.text }]} role="heading" aria-level={1}>
          今日生活物價
        </Text>
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
          {data.errors.length > 0 && (
            <Text style={{ color: t.muted, fontSize: 12 }}>⚠️ 部分資料暫時抓不到：{data.errors.join('；')}</Text>
          )}
          {section('fuel')}
          {section('gold')}
          {section('fx')}

          <PriceGauge items={data.items} />
          {latest && (
            <Link href={`/weekly/${latest.week}`} asChild>
              <Pressable style={StyleSheet.flatten([styles.teaser, { backgroundColor: t.card, borderColor: t.border }])}>
                <Text style={{ fontSize: 22 }}>📝</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.faint, fontSize: 12 }}>每週物價觀察・{weekRange(latest)}</Text>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{latest.title}</Text>
                </View>
                <Text style={{ color: t.accent, fontSize: 14 }}>閱讀 →</Text>
              </Pressable>
            </Link>
          )}

          <BargainCard items={data.items} />

          {section('veg')}
          {section('fruit')}
          {section('fish')}
          {section('meat')}

          <Text style={[styles.footnote, { color: t.faint }]}>
            單位：食物價格以台斤（600 公克）為主，旁邊附上每公斤價格。{'\n'}
            燈號：🔴 漲・🟡 持平・🟢 跌（蔬果、魚貨 ±5%、肉蛋 ±3%、匯率與金價 ±1% 以內算持平）{'\n'}
            K 線：每根代表一週，開盤 = 上週收盤，紅 = 收盤比開盤高，綠 = 比開盤低。點或滑過 K 棒可看明細。{'\n'}
            資料更新：{new Date(data.updatedAt).toLocaleString('zh-TW')}（每天早上自動更新）
          </Text>
        </>
      )}
    </SiteLayout>
  );
}

function Section({
  title,
  hint,
  list,
  columns,
  gap,
}: {
  title: string;
  hint: string;
  list: PriceItem[];
  columns: number;
  gap: number;
}) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.h2, { color: t.text }]} role="heading" aria-level={2}>
          {title}
        </Text>
        <Text style={{ color: t.faint, fontSize: 12, flexShrink: 1 }}>{hint}</Text>
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
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 19, fontWeight: '700' },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 60 },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  teaser: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16 },
  footnote: { fontSize: 12, lineHeight: 20 },
});
