/// <reference types="node" />
// 抓物價資料：從中油、農業部、匯率資料源抓最近 8 週資料，整理成週 K 線，
// 存成 public/data/prices.json。網頁直接讀這個檔案，不需要伺服器。
// 執行：npm run fetch-prices（GitHub Actions 每天自動跑一次）

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  changePct,
  dayNum,
  fromDayNum,
  taipeiToday,
  toWeeklyCandles,
  type Point,
  type PriceChange,
  type PriceItem,
  type PricesResponse,
} from '../src/lib/series.ts';
import { updateWeekly } from './weekly.mts';

const WEEKS = 8;
const DAYS = WEEKS * 7 + 7; // 多抓一週，算第一根 K 線的開盤
const MOA = 'https://data.moa.gov.tw/Service/OpenData/FromM';

type Def = Omit<PriceItem, 'price' | 'changePct' | 'candles'>;

function build(def: Def, points: Point[]): PriceItem {
  const candles = toWeeklyCandles(points, WEEKS);
  const last = candles[candles.length - 1];
  if (!last) throw new Error(`${def.name} 沒有資料`);
  return { ...def, price: last.close, changePct: changePct(candles), candles };
}

// 日期工具
const today = () => taipeiToday();
const daysAgo = (n: number) => fromDayNum(dayNum(today()) - n);
const rocDot = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(y) - 1911}.${m}.${d}`; // 115.10.20
};
const rocCompact = (iso: string) => rocDot(iso).replace(/\./g, ''); // 1151020
const fromRoc = (roc: string) => {
  const s = roc.replace(/\./g, '');
  return `${Number(s.slice(0, s.length - 4)) + 1911}-${s.slice(-4, -2)}-${s.slice(-2)}`;
};

// 失敗會自動重試 2 次
async function getJson(url: string, tries = 3): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } catch (e) {
    if (tries <= 1) throw e;
    await new Promise((r) => setTimeout(r, 1000));
    return getJson(url, tries - 1);
  }
}

// 同時最多跑 n 個請求，避免一次打太多
async function pool<T, R>(list: T[], n: number, fn: (x: T) => Promise<R>) {
  const out: R[] = [];
  for (let i = 0; i < list.length; i += n) {
    out.push(...(await Promise.all(list.slice(i, i + n).map(fn))));
  }
  return out;
}

const lastNDates = (n: number) => Array.from({ length: n }, (_, i) => daysAgo(n - 1 - i));

// ---------- 油價（中油）----------
const FUEL: { prodid: number; def: Def }[] = [
  { prodid: 1, def: { id: 'fuel92', name: '92 無鉛', icon: '⛽', category: 'fuel', unit: '元/公升', threshold: 0.1 } },
  { prodid: 2, def: { id: 'fuel95', name: '95 無鉛', icon: '⛽', category: 'fuel', unit: '元/公升', threshold: 0.1 } },
  { prodid: 4, def: { id: 'diesel', name: '超級柴油', icon: '🚛', category: 'fuel', unit: '元/公升', threshold: 0.1 } },
];

async function loadFuel(): Promise<PriceItem[]> {
  return Promise.all(
    FUEL.map(async ({ prodid, def }) => {
      const res = await fetch(
        `https://vipmbr.cpc.com.tw/cpcstn/listpricewebservice.asmx/getCPCMainProdListPrice_Historical?prodid=${prodid}`
      );
      const xml = await res.text();
      const points: Point[] = [];
      for (const row of xml.match(/<tbTable[\s\S]*?<\/tbTable>/g) ?? []) {
        const date = row.match(/<牌價生效時間>(\d{4}-\d{2}-\d{2})/)?.[1];
        const price = row.match(/<參考牌價>([^<]+)</)?.[1];
        // 只取已生效的價格
        if (date && price && date <= today()) points.push({ date, value: Number(price) });
      }
      points.sort((a, b) => (a.date < b.date ? -1 : 1));

      // 每一筆跟前一筆比，算出漲跌
      const changes: PriceChange[] = points.slice(1).map((p, i) => ({
        date: p.date,
        price: p.value,
        change: Math.round((p.value - points[i].value) * 10) / 10,
      }));
      return {
        ...build(def, points),
        recentWeeks: changes.slice(-4).reverse(), // 本週、上週、上上週、3 週前
        adjustments: changes.filter((c) => c.change !== 0).slice(-3).reverse(), // 最近 3 次調價
      };
    })
  );
}

// ---------- 蔬菜、水果批發價（農業部，台北一市場）----------
type CropDef = { crops: string[]; def: Def };
const crop = (id: string, name: string, icon: string, category: 'veg' | 'fruit', crops: string[]): CropDef => ({
  crops,
  def: { id, name, icon, category, unit: '元/公斤', threshold: 5, note: '台北一市場批發均價' },
});

const VEG: CropDef[] = [
  crop('cabbage', '高麗菜', '🥬', 'veg', ['甘藍-初秋']),
  crop('napa', '大白菜', '🥬', 'veg', ['包心白-包白']),
  crop('bokchoy', '小白菜', '🌿', 'veg', ['小白菜-土白菜']),
  crop('kangkong', '空心菜', '🌿', 'veg', ['蕹菜-小葉']),
  crop('scallion', '青蔥', '🧅', 'veg', ['青蔥-粉蔥']),
  crop('tomato', '牛番茄', '🍅', 'veg', ['番茄-牛番茄']),
  crop('onion', '洋蔥', '🧅', 'veg', ['洋蔥-本產', '洋蔥-進口']),
  crop('carrot', '胡蘿蔔', '🥕', 'veg', ['胡蘿蔔-清洗']),
  // 水果：挑一年四季大多買得到的品項
  crop('banana', '香蕉', '🍌', 'fruit', ['香蕉']),
  crop('guava', '芭樂', '🍏', 'fruit', ['番石榴-珍珠芭']),
  crop('papaya', '木瓜', '🍈', 'fruit', ['木瓜-網室紅肉']),
  crop('pineapple', '鳳梨', '🍍', 'fruit', ['鳳梨-金鑽鳳梨']),
  crop('apple', '蘋果', '🍎', 'fruit', ['蘋果-富士進口']),
  crop('watermelon', '西瓜', '🍉', 'fruit', ['西瓜-大西瓜']),
];

type TradeRow = { date: string; name: string; price: number; volume: number };

// 同一天多筆（不同品種或市場）時，用交易量加權平均
function weightedDaily(rows: TradeRow[], names: string[]): Point[] {
  const byDate = new Map<string, { sum: number; vol: number }>();
  for (const r of rows) {
    if (!names.includes(r.name) || !(r.volume > 0) || !(r.price > 0)) continue;
    const acc = byDate.get(r.date) ?? { sum: 0, vol: 0 };
    acc.sum += r.price * r.volume;
    acc.vol += r.volume;
    byDate.set(r.date, acc);
  }
  return [...byDate].map(([date, a]) => ({ date, value: Math.round((a.sum / a.vol) * 10) / 10 }));
}

// 某個品項這段期間完全沒交易（例如過季）就略過，不讓整類失敗
function buildMany(defs: CropDef[], rows: TradeRow[]): PriceItem[] {
  const out: PriceItem[] = [];
  for (const { crops, def } of defs) {
    const points = weightedDaily(rows, crops);
    if (points.length) out.push(build(def, points));
    else console.warn(`略過 ${def.name}：最近沒有交易資料`);
  }
  return out;
}

// 每 7 天一段平行抓
function weekRanges(): [string, string][] {
  const ranges: [string, string][] = [];
  for (let end = 0; end < DAYS; end += 7) ranges.push([daysAgo(end + 6), daysAgo(end)]);
  return ranges;
}

async function loadVeg(): Promise<PriceItem[]> {
  const chunks = await pool(weekRanges(), 4, ([s, e]) =>
    getJson(`${MOA}/FarmTransData.aspx?StartDate=${rocDot(s)}&EndDate=${rocDot(e)}&Market=%E5%8F%B0%E5%8C%97%E4%B8%80`)
  );
  const rows: TradeRow[] = chunks.flat().map((r: Record<string, any>) => ({
    date: fromRoc(r['交易日期']),
    name: String(r['作物名稱']).trim(),
    price: Number(r['平均價']),
    volume: Number(r['交易量']),
  }));
  return buildMany(VEG, rows);
}

// ---------- 魚貨（農業部，全台魚市場加權平均）----------
const fish = (id: string, name: string, icon: string, names: string[]): CropDef => ({
  crops: names,
  def: { id, name, icon, category: 'fish', unit: '元/公斤', threshold: 5, note: '全台魚市場批發均價' },
});

const FISH: CropDef[] = [
  fish('milkfish', '虱目魚', '🐟', ['虱目魚']),
  fish('tilapia', '吳郭魚', '🐟', ['吳郭魚']),
  fish('threadfin', '午仔魚', '🐠', ['午仔魚']),
  fish('hairtail', '白帶魚', '🐟', ['（日本）白帶魚']),
  fish('shrimp', '白蝦', '🦐', ['白蝦']),
  fish('oyster', '牡蠣（蚵仔）', '🦪', ['牡蠣養']),
];

async function loadFish(): Promise<PriceItem[]> {
  const chunks = await pool(weekRanges(), 4, ([s, e]) =>
    getJson(`${MOA}/AquaticTransData.aspx?StartDate=${rocCompact(s)}&EndDate=${rocCompact(e)}`)
  );
  const rows: TradeRow[] = chunks.flat().map((r: Record<string, any>) => ({
    date: fromRoc(String(r['交易日期'])),
    name: String(r['魚貨名稱']).trim(),
    price: Number(r['平均價']),
    volume: Number(r['交易量']),
  }));
  return buildMany(FISH, rows);
}

// ---------- 雞蛋、白肉雞（農業部）----------
async function loadPoultry(): Promise<PriceItem[]> {
  const rows: Record<string, string>[] = await getJson(`${MOA}/PoultryTransBoiledChickenData.aspx`);
  const since = daysAgo(DAYS);
  const pick = (field: string) =>
    rows
      .map((r) => ({ date: r['日期'].replace(/\//g, '-'), value: Number(r[field]) }))
      .filter((p) => p.date >= since && p.value > 0);
  return [
    build(
      { id: 'egg', name: '雞蛋', icon: '🥚', category: 'meat', unit: '元/台斤', threshold: 3, note: '產地價' },
      pick('雞蛋(產地價)')
    ),
    build(
      { id: 'chicken', name: '白肉雞', icon: '🐔', category: 'meat', unit: '元/台斤', threshold: 3, note: '2.0 公斤以上・產地價' },
      pick('白肉雞(2.0Kg以上)')
    ),
  ];
}

// ---------- 毛豬（農業部，全台各市場加權平均）----------
async function loadPork(): Promise<PriceItem> {
  const dates = lastNDates(DAYS);
  const days = await pool(dates, 10, async (date) => {
    const rows: Record<string, number>[] = await getJson(`${MOA}/AnimalTransData.aspx?TransDate=${rocCompact(date)}`).catch(
      () => []
    );
    let sum = 0;
    let heads = 0;
    for (const r of rows) {
      const n = Number(r['成交頭數-總數']);
      const p = Number(r['成交頭數-平均價格']);
      if (n > 0 && p > 0) {
        sum += n * p;
        heads += n;
      }
    }
    return heads ? { date, value: Math.round((sum / heads) * 10) / 10 } : null;
  });
  return build(
    { id: 'pork', name: '毛豬', icon: '🐷', category: 'meat', unit: '元/公斤', threshold: 3, note: '全台拍賣市場均價' },
    days.filter((d): d is Point => d != null)
  );
}

// ---------- 匯率、金價（fawazahmed0 currency-api，每日）----------
const FX: { code: string; per: number; def: Def }[] = [
  { code: 'jpy', per: 100, def: { id: 'jpy', name: '日圓', icon: '¥', category: 'fx', unit: '台幣/100 日圓', threshold: 1 } },
  { code: 'usd', per: 1, def: { id: 'usd', name: '美元', icon: '$', category: 'fx', unit: '台幣/1 美元', threshold: 1 } },
  { code: 'krw', per: 1000, def: { id: 'krw', name: '韓元', icon: '₩', category: 'fx', unit: '台幣/1000 韓元', threshold: 1 } },
  { code: 'eur', per: 1, def: { id: 'eur', name: '歐元', icon: '€', category: 'fx', unit: '台幣/1 歐元', threshold: 1 } },
];

// 金價：API 給的是每盎司（31.1035 公克），換算成台灣習慣的「錢」（3.75 公克）
const GRAMS_PER_OZ = 31.1034768;
const GRAMS_PER_CHIEN = 3.75;

async function loadFx(): Promise<PriceItem[]> {
  // 每天一筆（今天的資料通常還沒出來，抓不到就略過）
  const dates = lastNDates(DAYS);
  const days = (
    await pool(dates, 10, (date) =>
      getJson(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/twd.json`)
        .then((j) => ({ date, rates: j.twd as Record<string, number> }))
        .catch(() => null)
    )
  ).filter((d): d is { date: string; rates: Record<string, number> } => d != null);

  const fx = FX.map(({ code, per, def }) =>
    build(
      { ...def, note: '國際中間價，非銀行牌告' },
      days.filter((d) => d.rates[code]).map((d) => ({ date: d.date, value: Math.round((per / d.rates[code]) * 1000) / 1000 }))
    )
  );
  const gold = build(
    {
      id: 'gold',
      name: '黃金',
      icon: '💰',
      category: 'gold',
      unit: '元/錢',
      threshold: 1,
      note: '國際金價換算，銀樓牌價另計',
    },
    days
      .filter((d) => d.rates.xau)
      .map((d) => ({ date: d.date, value: Math.round((1 / d.rates.xau / GRAMS_PER_OZ) * GRAMS_PER_CHIEN) }))
  );
  return [...fx, gold];
}

// ---------- 組合 ----------
const SOURCES: [string, () => Promise<PriceItem | PriceItem[]>][] = [
  ['油價', loadFuel],
  ['蔬果', loadVeg],
  ['魚貨', loadFish],
  ['雞蛋', loadPoultry],
  ['毛豬', loadPork],
  ['匯率', loadFx],
];

async function main() {
  const started = Date.now();
  const results = await Promise.allSettled(SOURCES.map(([, fn]) => fn()));
  const items: PriceItem[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...([] as PriceItem[]).concat(r.value));
    else errors.push(`${SOURCES[i][0]}：${String(r.reason).slice(0, 120)}`);
  });

  const data: PricesResponse = { items, errors, updatedAt: new Date().toISOString() };
  // 在 GitHub Actions 上用 ::warning:: / ::notice:: 格式，結果會直接顯示在執行頁面
  const gh = !!process.env.GITHUB_ACTIONS;
  for (const e of errors) console.warn(gh ? `::warning::${e}` : `⚠️ ${e}`);
  if (gh) console.log(`::notice::成功 ${items.length} 項：${items.map((i) => i.name).join('、')}`);
  if (!items.length) {
    console.error('全部資料源都失敗，不寫入檔案');
    process.exit(1);
  }

  const out = join(import.meta.dirname, '..', 'public', 'data', 'prices.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(data));
  console.log(`✅ ${items.length} 項，耗時 ${((Date.now() - started) / 1000).toFixed(1)} 秒 → ${out}`);

  // 有資料源失敗時不更新文章，避免寫出缺項的內容
  if (!errors.length) {
    const n = updateWeekly(items, join(import.meta.dirname, '..', 'src', 'content', 'weekly.json'));
    console.log(`📝 每週觀察文章共 ${n} 篇`);
  }
}

main();
