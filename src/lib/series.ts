// 共用型別與「每日價格 → 週 K 線」的轉換。伺服器和畫面都會用到。

export type Point = { date: string; value: number }; // date: YYYY-MM-DD

export type Candle = {
  week: string; // 該週週一 YYYY-MM-DD
  open: number;
  close: number;
  high: number;
  low: number;
};

export type Category = 'fuel' | 'fx' | 'gold' | 'metal' | 'veg' | 'fruit' | 'fish' | 'meat';

export type PriceItem = {
  id: string;
  name: string;
  icon: string;
  category: Category;
  unit: string;
  price: number;
  changePct: number | null; // 與上週收盤相比（%）
  threshold: number; // 超過這個 % 才算漲或跌
  candles: Candle[];
  note?: string;
};

export type PricesResponse = {
  items: PriceItem[];
  errors: string[];
  updatedAt: string;
};

const DAY = 86400000;

export function dayNum(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
}

export function fromDayNum(n: number) {
  return new Date(n * DAY).toISOString().slice(0, 10);
}

// 台灣時間的今天（YYYY-MM-DD）
export function taipeiToday() {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
}

// 該日所屬那週的週一
function mondayOf(n: number) {
  const dow = (new Date(n * DAY).getUTCDay() + 6) % 7; // 週一=0
  return n - dow;
}

/**
 * 把每日（或不定期）價格切成最近 `weeks` 週的 K 線。
 * 開盤 = 上週收盤，收盤 = 本週最後一筆，最高/最低含開盤價。
 * 某週沒有資料（例如休市）就沿用上週價格。
 */
export function toWeeklyCandles(points: Point[], weeks = 8, today = taipeiToday()): Candle[] {
  const sorted = [...points].sort((a, b) => dayNum(a.date) - dayNum(b.date));
  const thisMonday = mondayOf(dayNum(today));
  const firstMonday = thisMonday - (weeks - 1) * 7;

  const before = sorted.filter((p) => dayNum(p.date) < firstMonday);
  let prevClose: number | null = before.length ? before[before.length - 1].value : null;

  const candles: Candle[] = [];
  for (let w = 0; w < weeks; w++) {
    const start = firstMonday + w * 7;
    const vals = sorted
      .filter((p) => dayNum(p.date) >= start && dayNum(p.date) < start + 7)
      .map((p) => p.value);
    if (!vals.length && prevClose == null) continue;
    const open = prevClose ?? vals[0];
    const close = vals.length ? vals[vals.length - 1] : open;
    candles.push({
      week: fromDayNum(start),
      open,
      close,
      high: Math.max(open, ...vals),
      low: Math.min(open, ...vals),
    });
    prevClose = close;
  }
  return candles;
}

export function changePct(candles: Candle[]) {
  const last = candles[candles.length - 1];
  if (!last || !last.open) return null;
  return Math.round(((last.close - last.open) / last.open) * 1000) / 10;
}

export type Trend = 'up' | 'flat' | 'down';

export function trendOf(pct: number | null, threshold: number): Trend {
  if (pct == null || Math.abs(pct) < threshold) return 'flat';
  return pct > 0 ? 'up' : 'down';
}

// 算進「物價溫度計」的類別（匯率、金價屬於投資/換匯，不算民生物價）
export const IN_GAUGE: Category[] = ['fuel', 'veg', 'fruit', 'fish', 'meat'];
// 可以做「划算推薦」的類別（油價固定、匯率金價不算採買）
export const SHOPPING: Category[] = ['veg', 'fruit', 'fish', 'meat'];

/** 目前價格和最近 8 週收盤平均相比（%），例如 -20 代表比平常便宜 2 成 */
export function vsAverage(item: PriceItem): number | null {
  const closes = item.candles.map((c) => c.close);
  if (closes.length < 4) return null;
  const avg = closes.reduce((s, v) => s + v, 0) / closes.length;
  return avg ? Math.round(((item.price - avg) / avg) * 1000) / 10 : null;
}

// 台灣傳統市場多用「台斤」標價：1 台斤 = 600 公克
export const KG_PER_CATTY = 0.6;

/** 食物主要顯示「元/台斤」，旁邊補上每公斤價格；不是食物或不是台斤計價就回傳 null */
export function perKg(item: Pick<PriceItem, 'unit' | 'category'>, price: number): number | null {
  return item.unit === '元/台斤' && SHOPPING.includes(item.category) ? Math.round((price / KG_PER_CATTY) * 10) / 10 : null;
}
