import { addPortions, nutritionOf, type Portions } from './exchange';

// 每日飲食紀錄（只存在使用者自己的瀏覽器）

export const MEALS = ['早餐', '午餐', '晚餐', '點心'] as const;
export type Meal = (typeof MEALS)[number];

export type MealEntry = { id: string; meal: Meal; name: string; p: Portions; extra: number };
export type ExerciseEntry = { id: string; name: string; minutes: number; kcal: number };
export type Day = { meals: MealEntry[]; exercise: ExerciseEntry[]; water: number };
export type Combo = { id: string; name: string; p: Portions; extra: number };

// plan：使用者自訂的每日份數（例如營養師給的減脂菜單）；沒設定就用國健署建議
export type Log = { days: Record<string, Day>; combos: Combo[]; plan?: Portions; planName?: string };

export const EMPTY_LOG: Log = { days: {}, combos: [] };
export const EMPTY_DAY: Day = { meals: [], exercise: [], water: 0 };

const KEEP_DAYS = 90;

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 裝置本地時間的日期 YYYY-MM-DD */
export function localDate(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function shiftDate(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function dateLabel(date: string, today: string) {
  const [y, m, d] = date.split('-').map(Number);
  const w = ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d).getDay()];
  const rel = date === today ? '今天・' : date === shiftDate(today, -1) ? '昨天・' : '';
  return `${rel}${m}/${d}（${w}）`;
}

export function getDay(log: Log, date: string): Day {
  return { ...EMPTY_DAY, ...log.days[date] };
}

/** 更新某一天；順便刪掉太舊的紀錄，避免瀏覽器空間越塞越滿 */
export function setDay(log: Log, date: string, day: Day): Log {
  const oldest = shiftDate(date, -KEEP_DAYS);
  const days: Record<string, Day> = {};
  for (const [k, v] of Object.entries(log.days)) if (k >= oldest) days[k] = v;
  days[date] = day;
  return { ...log, days };
}

export function dayTotals(day: Day) {
  let portions: Portions = {};
  let extra = 0;
  for (const m of day.meals) {
    portions = addPortions(portions, m.p);
    extra += m.extra;
  }
  const food = nutritionOf(portions, extra);
  const burned = day.exercise.reduce((s, e) => s + e.kcal, 0);
  return { portions, food, burned, net: Math.round(food.kcal) - burned };
}

export const hasRecord = (day: Day | undefined) => !!day && (day.meals.length > 0 || day.exercise.length > 0);
