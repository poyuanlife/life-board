// 首頁「自訂版面」：每個人可以調整區塊的順序、放左側欄或主要欄、隱藏不要的。
// 設定存在使用者自己的瀏覽器（localStorage），不會上傳。

export type WidgetId =
  | 'weather'
  | 'quakes'
  | 'typhoon'
  | 'fuel'
  | 'gold'
  | 'fx'
  | 'gauge'
  | 'weekly'
  | 'bargain'
  | 'veg'
  | 'fruit'
  | 'fish'
  | 'meat';

export const WIDGETS: Record<WidgetId, { icon: string; label: string }> = {
  weather: { icon: '🌡️', label: '天氣' },
  quakes: { icon: '🌏', label: '最新地震' },
  typhoon: { icon: '🌀', label: '颱風動態（有颱風才出現）' },
  fuel: { icon: '⛽', label: '油價' },
  gold: { icon: '💰', label: '金價・國際金屬' },
  fx: { icon: '💱', label: '匯率' },
  gauge: { icon: '🌡️', label: '物價溫度計' },
  weekly: { icon: '📝', label: '每週物價觀察' },
  bargain: { icon: '🛒', label: '本週划算推薦' },
  veg: { icon: '🥬', label: '蔬菜' },
  fruit: { icon: '🍎', label: '水果' },
  fish: { icon: '🐟', label: '魚貨海鮮' },
  meat: { icon: '🥩', label: '肉品・雞蛋' },
};

export type Layout = { side: WidgetId[]; main: WidgetId[]; hidden: WidgetId[] };

export const DEFAULT_LAYOUT: Layout = {
  side: ['weather', 'quakes', 'typhoon'],
  main: ['fuel', 'gold', 'fx', 'gauge', 'weekly', 'bargain', 'veg', 'fruit', 'fish', 'meat'],
  hidden: [],
};

const ALL = Object.keys(WIDGETS) as WidgetId[];
const isId = (x: unknown): x is WidgetId => typeof x === 'string' && x in WIDGETS;

/**
 * 整理存起來的設定：去掉不認得的、重複的；之後新增的區塊自動補到預設的那一欄。
 * 存的資料壞掉也不會讓首頁出錯。
 */
export function normalize(raw: Partial<Layout> | null | undefined): Layout {
  const seen = new Set<WidgetId>();
  const clean = (list: unknown) =>
    (Array.isArray(list) ? list : []).filter((x): x is WidgetId => isId(x) && !seen.has(x) && !!seen.add(x));
  const out: Layout = { side: clean(raw?.side), main: clean(raw?.main), hidden: clean(raw?.hidden) };
  for (const id of ALL) {
    if (seen.has(id)) continue;
    (DEFAULT_LAYOUT.side.includes(id) ? out.side : out.main).push(id);
  }
  return out;
}

/** 手機版的單欄順序：左側欄的排在最上面 */
export const flatOrder = (l: Layout) => [...l.side, ...l.main];

/**
 * 上移（-1）或下移（+1）。
 * cross = true（手機版）：在兩欄交界處會換到另一欄，例如主要欄第一個再往上 → 變成左側欄最後一個。
 * cross = false（電腦版）：只在同一欄內移動，換欄用 switchColumn。
 */
export function move(l: Layout, id: WidgetId, dir: -1 | 1, cross: boolean): Layout {
  const side = [...l.side];
  const main = [...l.main];
  const col = side.includes(id) ? side : main.includes(id) ? main : null;
  if (!col) return l;
  const i = col.indexOf(id);
  const j = i + dir;
  if (j >= 0 && j < col.length) {
    [col[i], col[j]] = [col[j], col[i]];
  } else if (cross && col === side && dir === 1) {
    side.splice(i, 1);
    main.unshift(id);
  } else if (cross && col === main && dir === -1) {
    main.splice(i, 1);
    side.push(id);
  } else {
    return l;
  }
  return { ...l, side, main };
}

/** 電腦版：在左側欄和主要欄之間換欄（放到另一欄的最上面） */
export function switchColumn(l: Layout, id: WidgetId): Layout {
  if (l.side.includes(id)) return { ...l, side: l.side.filter((x) => x !== id), main: [id, ...l.main] };
  if (l.main.includes(id)) return { ...l, main: l.main.filter((x) => x !== id), side: [id, ...l.side] };
  return l;
}

/** 隱藏；已隱藏的就重新顯示（放回預設的那一欄最後面） */
export function toggleHidden(l: Layout, id: WidgetId): Layout {
  if (l.hidden.includes(id)) {
    const toSide = DEFAULT_LAYOUT.side.includes(id);
    return {
      hidden: l.hidden.filter((x) => x !== id),
      side: toSide ? [...l.side, id] : l.side,
      main: toSide ? l.main : [...l.main, id],
    };
  }
  return { side: l.side.filter((x) => x !== id), main: l.main.filter((x) => x !== id), hidden: [...l.hidden, id] };
}
