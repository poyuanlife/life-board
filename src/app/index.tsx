import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { BargainCard } from '@/components/BargainCard';
import { LayoutEditor } from '@/components/LayoutEditor';
import { MenuButton, WidgetMenu } from '@/components/WidgetMenu';
import { CaloriesMini, QuakeMini, TyphoonMini, WeatherMini, YouTubeMini } from '@/components/MiniWidgets';
import { PriceCard } from '@/components/PriceCard';
import { PriceGauge } from '@/components/PriceGauge';
import { SiteLayout } from '@/components/SiteLayout';
import { DEFAULT_LAYOUT, DEVICE_NOTE, flatOrder, normalize, WIDGETS, type Layout, type WidgetId } from '@/lib/layout';
import { meta, PAGES } from '@/lib/meta';
import { PRICES, taipeiTime } from '@/lib/prices-data';
import type { Category, PriceItem } from '@/lib/series';
import { useStoredState } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { weekRange, type WeeklyArticle } from '@/lib/weekly';
import weekly from '@/content/weekly.json';

const latest = (weekly as WeeklyArticle[])[0];

const SECTIONS: Record<Category, { title: string; hint: string }> = {
  fuel: { title: '⛽ 油價', hint: '中油牌價每週一調整・國際原油為期貨價（美元/桶），不計入溫度計' },
  stock: { title: '📈 股市指數', hint: '前一交易日收盤・每天早上更新・僅供參考，不構成投資建議・不計入溫度計' },
  oil: { title: '🛢️ 國際原油', hint: '國際期貨價（美元/桶）・不計入溫度計' },
  fx: {
    title: '💱 匯率',
    hint: '國際中間價，換匯請以銀行牌告為準・不計入溫度計',
  },
  gold: {
    title: '💰 金價・國際金屬',
    hint: '國際價格換算台幣：黃金 1 錢 = 3.75 公克（銀樓買賣價另計），銅與鐵礦砂為期貨價（非回收價）・不計入溫度計',
  },
  metal: {
    title: '🔩 國際金屬',
    hint: '國際期貨價格換算台幣，不是回收價・不計入溫度計',
  },
  veg: {
    title: '🥬 蔬菜',
    hint: '農業部・台北一市場批發價（零售價約為 2～3 倍）',
  },
  fruit: { title: '🍎 水果', hint: '農業部・台北一市場批發價' },
  fish: { title: '🐟 魚貨海鮮', hint: '農業部・全台魚市場批發價' },
  meat: { title: '🥩 肉品・雞蛋', hint: '農業部・產地/拍賣價' },
};

// 電腦版左側欄的寬度；內容寬度不夠放兩欄時（手機、平板直向）改成單欄
const SIDE_WIDTH = 320;
const TWO_COLUMN_MIN = 900;

/** 台灣時間的日期，例如 2026/10/21（三） */
function dateText(ms: number) {
  const d = new Date(ms + 8 * 3600000);
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getUTCDay()];
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}（${w}）`;
}

export function generateMetadata() {
  return meta(PAGES.home.title, PAGES.home.description);
}

export default function Home() {
  const t = useTheme();
  const [inner, setInner] = useState(0);
  const data = PRICES;
  // 靜態網頁先顯示資料日期，打開後再換成使用者的今天
  const [today, setToday] = useState(() => dateText(Date.parse(data.updatedAt)));
  useEffect(() => setToday(dateText(Date.now())), []);

  // 每個人自己的版面（存在瀏覽器）；第一次來或設定壞掉就用預設
  const [stored, setStored] = useStoredState<Layout>('home-layout', DEFAULT_LAYOUT);
  const layout = normalize(stored);
  const [editing, setEditing] = useState(false);
  // 導覽列右上角的「⚙️ 自訂」會連到 /?edit=1
  const params = useLocalSearchParams<{ edit?: string }>();
  useEffect(() => {
    if (params.edit === '1') setEditing(true);
  }, [params.edit]);
  const finishEditing = () => {
    setEditing(false);
    if (params.edit) router.replace('/');
  };
  const [menuFor, setMenuFor] = useState<WidgetId | null>(null);
  // 剛隱藏區塊時，畫面下方出現「復原」幾秒鐘
  const [undo, setUndo] = useState<{ before: Layout; label: string } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(timer);
  }, [undo]);

  const wide = inner >= TWO_COLUMN_MIN && layout.side.length > 0;
  const mainWidth = wide ? inner - SIDE_WIDTH - 20 : inner;
  // 依主要欄寬度決定物價卡片欄數（手機 1 欄 → 電腦最多 4 欄）
  const columns = mainWidth >= 1180 ? 4 : mainWidth >= 820 ? 3 : mainWidth >= 520 ? 2 : 1;
  const gap = 12;

  const section = (key: Category, menu: ReactNode, also: Category[] = []) => {
    const list = data.items.filter((i) => i.category === key || also.includes(i.category));
    if (!list.length) return null;
    return (
      <Section
        title={SECTIONS[key].title}
        hint={SECTIONS[key].hint}
        list={list}
        columns={columns}
        gap={gap}
        menu={menu}
      />
    );
  };

  const widget = (id: WidgetId): ReactNode => {
    const menu = <MenuButton id={id} onOpen={setMenuFor} />;
    switch (id) {
      case 'weather':
        return <WeatherMini menu={menu} />;
      case 'quakes':
        return <QuakeMini menu={menu} />;
      case 'typhoon':
        return <TyphoonMini menu={menu} />;
      case 'calories':
        return <CaloriesMini menu={menu} />;
      case 'youtube':
        return <YouTubeMini menu={menu} />;
      case 'fx':
      case 'stock':
      case 'veg':
      case 'fruit':
      case 'fish':
      case 'meat':
        return section(id, menu);
      case 'fuel':
        return section('fuel', menu, ['oil']);
      case 'gold':
        return section('gold', menu, ['metal']);
      case 'gauge':
        return <PriceGauge items={data.items} menu={menu} />;
      case 'bargain':
        return <BargainCard items={data.items} menu={menu} />;
      case 'weekly':
        return latest ? (
          <View style={styles.weeklyRow}>
            <Link href={`/weekly/${latest.week}`} asChild>
              <Pressable
                style={StyleSheet.flatten([styles.teaser, { backgroundColor: t.card, borderColor: t.border }])}>
                <Text style={{ fontSize: 22 }}>📝</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: t.faint, fontSize: 12 }}>每週物價觀察・{weekRange(latest)}</Text>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '700' }}>{latest.title}</Text>
                </View>
                <Text style={{ color: t.accent, fontSize: 14 }}>閱讀 →</Text>
              </Pressable>
            </Link>
            {menu}
          </View>
        ) : null;
    }
  };

  // 用 Fragment 包，區塊沒內容時（例如沒有颱風）不會多出空白
  const column = (ids: WidgetId[]) => ids.map((id) => <Fragment key={id}>{widget(id)}</Fragment>);

  return (
    <SiteLayout title={PAGES.home.title} description={PAGES.home.description} onWidth={setInner}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.h1, { color: t.text }]} role="heading" aria-level={1}>
            今日生活物價
          </Text>
          <Text style={{ color: t.muted }}>{today}</Text>
        </View>
      </View>

      {editing ? (
        <LayoutEditor
          layout={layout}
          wide={inner >= TWO_COLUMN_MIN}
          onChange={setStored}
          onDone={finishEditing}
        />
      ) : (
        <>
          {data.errors.length > 0 && (
            <Text style={{ color: t.muted, fontSize: 12 }}>⚠️ 部分資料暫時抓不到：{data.errors.join('；')}</Text>
          )}
          {wide ? (
            <View style={styles.twoCols}>
              <View style={[styles.col, { width: SIDE_WIDTH }]}>{column(layout.side)}</View>
              <View style={[styles.col, { flex: 1, minWidth: 0 }]}>{column(layout.main)}</View>
            </View>
          ) : (
            <View style={styles.col}>{column(flatOrder(layout))}</View>
          )}

          <Text style={[styles.footnote, { color: t.faint }]}>
            單位：食物價格以台斤（600 公克）為主，旁邊附上每公斤價格。{'\n'}
            燈號：🔴 漲・🟡 持平・🟢 跌（蔬果、魚貨 ±5%、肉蛋 ±3%、匯率與金價 ±1%、國際金屬與原油 ±2%、股市指數 ±1% 以內算持平）{'\n'}K
            線：每根代表一週，開盤 = 上週收盤，紅 = 收盤比開盤高，綠 = 比開盤低。點或滑過 K 棒可看明細。
            {'\n'}
            資料更新：{taipeiTime(data.updatedAt)}
            （每天早上自動更新）{'\n'}
            自訂版面：按區塊右上的 ⋯，或畫面最上方的「⚙️ 自訂」。{DEVICE_NOTE}
          </Text>
        </>
      )}

      <WidgetMenu
        id={menuFor}
        layout={layout}
        wide={wide}
        onChange={setStored}
        onHide={(id) => setUndo({ before: layout, label: WIDGETS[id].label })}
        onCustomize={() => setEditing(true)}
        onClose={() => setMenuFor(null)}
      />
      {undo && (
        <View style={[styles.toast, { backgroundColor: t.text }]} accessibilityLiveRegion="polite">
          <Text style={{ color: t.bg, flex: 1 }}>已隱藏「{undo.label}」，可在「⚙️ 自訂版面」找回</Text>
          <Pressable
            onPress={() => {
              setStored(undo.before);
              setUndo(null);
            }}
            accessibilityRole="button"
            style={styles.toastBtn}>
            <Text style={{ color: t.bg, fontWeight: '800' }}>復原</Text>
          </Pressable>
        </View>
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
  menu,
}: {
  title: string;
  hint: string;
  list: PriceItem[];
  columns: number;
  gap: number;
  menu?: ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.h2, { color: t.text }]} role="heading" aria-level={2}>
          {title}
        </Text>
        <Text
          style={{
            color: t.faint,
            fontSize: 12,
            flexShrink: 1,
            flex: 1,
            minWidth: 160,
          }}>
          {hint}
        </Text>
        {menu}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 19, fontWeight: '700' },
  twoCols: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  col: { gap: 20 },
  section: { gap: 10 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    flexWrap: 'wrap',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  teaser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  footnote: { fontSize: 12, lineHeight: 20 },
  weeklyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // 畫面最下方的提示（網頁上固定在視窗底部）
  toast: {
    position: 'fixed' as 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    maxWidth: 520,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    zIndex: 50,
  },
  toastBtn: {
    minHeight: 44,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
