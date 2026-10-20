/// <reference types="node" />
// 依照最近 8 週的 K 線，自動寫出每週物價觀察文章。
// 每根 K 線就是一週：開盤 = 上週收盤、收盤 = 本週最後價格，所以每週漲跌 = 收盤 / 開盤。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { dayNum, fromDayNum, IN_GAUGE, SHOPPING, taipeiToday, trendOf, type Category, type PriceItem } from '../src/lib/series.ts';
import type { WeeklyArticle, WeeklySection } from '../src/lib/weekly.ts';

type Row = {
  item: PriceItem;
  open: number;
  close: number;
  pct: number;
  avg: number | null; // 到這週為止（含）的週收盤平均
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const sign = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));
const join = (list: string[]) =>
  list.length <= 1 ? list.join('') : `${list.slice(0, -1).join('、')}和${list[list.length - 1]}`;

function rowsForWeek(items: PriceItem[], week: string): Row[] {
  const rows: Row[] = [];
  for (const item of items) {
    const idx = item.candles.findIndex((c) => c.week === week);
    if (idx < 0) continue;
    const c = item.candles[idx];
    const closes = item.candles.slice(0, idx + 1).map((k) => k.close);
    rows.push({
      item,
      open: c.open,
      close: c.close,
      pct: c.open ? round1(((c.close - c.open) / c.open) * 100) : 0,
      avg: closes.length >= 3 ? closes.reduce((s, v) => s + v, 0) / closes.length : null,
    });
  }
  return rows;
}

const price = (r: Row) => r.close.toFixed(r.item.category === 'fx' ? 2 : 1);
const trend = (r: Row) => trendOf(r.pct, r.item.threshold);

// 跟近幾週平均比，給一句背景說明
function vsAvg(r: Row) {
  if (r.avg == null) return '';
  const d = round1(((r.close - r.avg) / r.avg) * 100);
  if (Math.abs(d) < 5) return `，價格大約在近期平均水準`;
  // 漲了但仍偏低、跌了但仍偏高 → 用「但仍」；方向一致 → 用「已」
  const same = (r.pct > 0) === (d > 0);
  return `，${same ? '已' : '但仍'}比近期平均${d > 0 ? '高' : '低'} ${Math.abs(d)}%`;
}

function fuelSection(rows: Row[]): WeeklySection | null {
  const fuel = rows.filter((r) => r.item.category === 'fuel');
  if (!fuel.length) return null;
  const list = fuel.map((r) => `${r.item.name}每公升 ${price(r)} 元`).join('、');
  const changed = fuel.filter((r) => r.close !== r.open);
  let lead: string;
  if (!changed.length) {
    lead = `中油本週牌價不變，${list}。`;
  } else {
    const diffs = changed.map((r) => round1(r.close - r.open));
    const allSame = diffs.every((d) => d === diffs[0]);
    lead = allSame
      ? `中油本週汽柴油${diffs[0] > 0 ? '調漲' : '調降'} ${Math.abs(diffs[0]).toFixed(1)} 元，調整後${list}。`
      : `中油本週調整牌價：${changed
          .map((r) => `${r.item.name}${r.close > r.open ? '漲' : '降'} ${Math.abs(round1(r.close - r.open)).toFixed(1)} 元`)
          .join('、')}，調整後${list}。`;
  }
  // 一箱油（以 50 公升計）的差額，讓數字更有感
  const p92 = fuel.find((r) => r.item.id === 'fuel92');
  const extra =
    p92 && p92.close !== p92.open
      ? `以加滿 50 公升 92 無鉛計算，一次${p92.close > p92.open ? '多花' : '省下'}約 ${Math.abs(round1((p92.close - p92.open) * 50))} 元。`
      : '';
  return { heading: '⛽ 油價', paragraphs: [lead + extra] };
}

function fxSection(rows: Row[]): WeeklySection | null {
  const fx = rows.filter((r) => r.item.category === 'fx');
  if (!fx.length) return null;
  const parts = fx.map((r) => {
    const unit = r.item.unit.replace('台幣/', '');
    const dir = Math.abs(r.pct) < 0.1 ? '持平' : r.pct > 0 ? `升值 ${r.pct}%` : `貶值 ${Math.abs(r.pct)}%`;
    return `${unit}兌 ${price(r)} 台幣（${dir}）`;
  });
  const paras = [`本週各主要外幣對台幣：${parts.join('、')}。`];
  const jpy = fx.find((r) => r.item.id === 'jpy');
  if (jpy && trend(jpy) !== 'flat') {
    paras.push(
      jpy.pct < 0
        ? `日圓本週走貶，同樣的台幣可以換到更多日圓，對近期要去日本旅遊的人較有利。`
        : `日圓本週走升，換同樣的日圓需要更多台幣，有換匯需求可以分批進行。`
    );
  }
  paras.push('以上為國際中間價，實際換匯請以銀行牌告匯率為準。');
  return { heading: '💱 匯率', paragraphs: paras };
}

function goodsSection(rows: Row[], cat: Category, heading: string): WeeklySection | null {
  const list = rows.filter((r) => r.item.category === cat);
  if (!list.length) return null;
  const ups = list.filter((r) => trend(r) === 'up').sort((a, b) => b.pct - a.pct);
  const downs = list.filter((r) => trend(r) === 'down').sort((a, b) => a.pct - b.pct);
  const flats = list.filter((r) => trend(r) === 'flat');
  const unitOf = (r: Row) => r.item.unit.replace('元/', '每');
  const fmt = (r: Row) => `${r.item.name}（${unitOf(r)} ${price(r)} 元，${sign(r.pct)}%）`;

  const paras: string[] = [];
  if (ups.length) paras.push(`漲幅較明顯的有${join(ups.map(fmt))}。`);
  if (downs.length) paras.push(`價格回落的有${join(downs.map(fmt))}。`);
  if (flats.length) paras.push(`${join(flats.map((r) => r.item.name))}大致持平。`);

  // 最大漲跌的品項加上和近期平均的比較
  const notable = [ups[0], downs[0]].filter(Boolean) as Row[];
  for (const r of notable) {
    const ctx = vsAvg(r);
    if (ctx) paras.push(`${r.item.name}本週${r.pct > 0 ? '上漲' : '下跌'} ${Math.abs(r.pct)}%${ctx}。`);
  }
  return { heading, paragraphs: paras };
}

function goldSection(rows: Row[]): WeeklySection | null {
  const g = rows.find((r) => r.item.category === 'gold');
  if (!g) return null;
  const p = Math.round(g.close).toLocaleString('en-US');
  const diff = Math.round(g.close - g.open);
  const dir =
    Math.abs(g.pct) < 0.1 ? '與上週大致持平' : `較上週${diff > 0 ? '上漲' : '下跌'} ${Math.abs(diff).toLocaleString('en-US')} 元（${sign(g.pct)}%）`;
  return {
    heading: '💰 金價',
    paragraphs: [
      `國際金價換算約每錢 ${p} 元，${dir}。銀樓的買進、賣出牌價會另外加上工本與價差，實際買賣請以店家報價為準。`,
    ],
  };
}

const CHEAP = -15; // 比近期平均便宜 15% 以上
const PRICEY = 20; // 貴 20% 以上

function bargainSection(rows: Row[]): WeeklySection | null {
  const list = rows
    .filter((r) => SHOPPING.includes(r.item.category) && r.avg != null)
    .map((r) => ({ r, d: round1(((r.close - r.avg!) / r.avg!) * 100) }));
  const cheap = list.filter((x) => x.d <= CHEAP).sort((a, b) => a.d - b.d).slice(0, 5);
  const pricey = list.filter((x) => x.d >= PRICEY).sort((a, b) => b.d - a.d).slice(0, 3);
  if (!cheap.length && !pricey.length) return null;
  const paras: string[] = [];
  if (cheap.length)
    paras.push(`比近期平均便宜、這週適合多買的有${join(cheap.map((x) => `${x.r.item.name}（便宜 ${Math.abs(x.d).toFixed(0)}%）`))}。`);
  if (pricey.length)
    paras.push(`比近期平均貴、可以先少買或找替代品的有${join(pricey.map((x) => `${x.r.item.name}（貴 ${x.d.toFixed(0)}%）`))}。`);
  return { heading: '🛒 本週划算推薦', paragraphs: paras };
}

export function buildArticle(items: PriceItem[], week: string, isFinal: boolean): WeeklyArticle | null {
  const rows = rowsForWeek(items, week);
  if (!rows.length) return null;
  const goods = rows.filter((r) => IN_GAUGE.includes(r.item.category));
  const avgPct = goods.length ? round1(goods.reduce((s, r) => s + r.pct, 0) / goods.length) : 0;
  const ups = goods.filter((r) => trend(r) === 'up').sort((a, b) => b.pct - a.pct);
  const downs = goods.filter((r) => trend(r) === 'down').sort((a, b) => a.pct - b.pct);
  const flatN = goods.length - ups.length - downs.length;

  const range = (() => {
    const f = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
    return `${f(week)}–${f(fromDayNum(dayNum(week) + 6))}`;
  })();
  const headline =
    ups[0] && downs[0]
      ? `${ups[0].item.name}漲 ${ups[0].pct}%、${downs[0].item.name}跌 ${Math.abs(downs[0].pct)}%`
      : ups[0]
        ? `${ups[0].item.name}領漲 ${ups[0].pct}%`
        : downs[0]
          ? `${downs[0].item.name}領跌 ${Math.abs(downs[0].pct)}%`
          : '民生物價大致持平';
  const mood = Math.abs(avgPct) < 2 ? '大致持平' : avgPct > 0 ? '上漲' : '下跌';

  const summary =
    `本週 ${goods.length} 項民生物資與上週相比平均${avgPct >= 0 ? '上漲' : '下跌'} ${Math.abs(avgPct)}%，整體${mood}；` +
    `其中 ${ups.length} 項上漲、${flatN} 項持平、${downs.length} 項下跌。` +
    (isFinal ? '' : '本週尚未結束，內容會每天依最新行情更新。');

  const sections = [
    fuelSection(rows),
    fxSection(rows),
    goldSection(rows),
    bargainSection(rows),
    goodsSection(rows, 'veg', '🥬 蔬菜'),
    goodsSection(rows, 'fruit', '🍎 水果'),
    goodsSection(rows, 'fish', '🐟 魚貨海鮮'),
    goodsSection(rows, 'meat', '🥩 肉品・雞蛋'),
    {
      heading: '📌 閱讀說明',
      paragraphs: [
        '蔬果為台北一市場批發均價，魚貨為全台魚市場批發均價，雞蛋、白肉雞為產地價，毛豬為全台拍賣市場均價；市場或超市的零售價通常是批發價的 2～3 倍，建議把重點放在漲跌趨勢。',
        '本文由生活物價看板依公開資料自動整理，僅供生活採買參考。',
      ],
    },
  ].filter(Boolean) as WeeklySection[];

  return {
    week,
    end: fromDayNum(dayNum(week) + 6),
    title: `${range} 物價觀察：${headline}`,
    summary,
    avgPct,
    sections,
    final: isFinal,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 更新文章檔：補上還沒有的週、重寫「本週」和「上週」（上週要等週一才拿得到週日的完整資料）。
 * 更早的文章保持不動，當作存檔。
 */
export function updateWeekly(items: PriceItem[], file: string) {
  const existing: WeeklyArticle[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const byWeek = new Map(existing.map((a) => [a.week, a]));

  const weeks = [...new Set(items.flatMap((i) => i.candles.map((c) => c.week)))].sort();
  const thisMonday = weeks[weeks.length - 1];
  const lastMonday = fromDayNum(dayNum(thisMonday) - 7);
  // 第一週沒有上週收盤可比，跳過
  for (const week of weeks.slice(1)) {
    if (byWeek.has(week) && week < lastMonday) continue;
    const isFinal = dayNum(week) + 6 < dayNum(taipeiToday());
    const a = buildArticle(items, week, isFinal);
    if (a) byWeek.set(week, a);
  }

  const all = [...byWeek.values()].sort((a, b) => (a.week < b.week ? 1 : -1));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(all, null, 2) + '\n');
  return all.length;
}
