// 首頁「自訂版面」：每個人可以調整區塊的順序、放左側欄或主要欄、隱藏不要的。
// 設定存在使用者自己的瀏覽器（localStorage），不會上傳。
//
// 電腦版是兩欄（side 左側欄、main 主要欄）；手機版是一條由上到下的清單。
// 手機版的順序預設由兩欄推算（財經區塊在最前面），使用者在手機上調整過就另外記在 phone。

export type WidgetId =
  | 'market'
  | 'weather'
  | 'quakes'
  | 'typhoon'
  | 'fuel'
  | 'gold'
  | 'fx'
  | 'stock'
  | 'gauge'
  | 'weekly'
  | 'bargain'
  | 'veg'
  | 'fruit'
  | 'fish'
  | 'meat'
  | 'calories'
  | 'youtube';

export const WIDGETS: Record<WidgetId, { icon: string; label: string }> = {
  market: { icon: '📊', label: '市場快覽' },
  weather: { icon: '⛅', label: '天氣' },
  quakes: { icon: '🌏', label: '最新地震' },
  typhoon: { icon: '🌀', label: '颱風動態（有颱風才出現）' },
  fuel: { icon: '⛽', label: '油價・國際原油' },
  gold: { icon: '💰', label: '金價・國際金屬' },
  fx: { icon: '💱', label: '匯率' },
  stock: { icon: '📈', label: '股市指數' },
  gauge: { icon: '🌡️', label: '物價溫度計' },
  weekly: { icon: '📝', label: '每週物價觀察' },
  bargain: { icon: '🛒', label: '本週划算推薦' },
  veg: { icon: '🥬', label: '蔬菜' },
  fruit: { icon: '🍎', label: '水果' },
  fish: { icon: '🐟', label: '魚貨海鮮' },
  meat: { icon: '🥩', label: '肉品・雞蛋' },
  calories: { icon: '🍱', label: '今天的熱量（熱量計算）' },
  youtube: { icon: '📺', label: 'YouTube 熱門前 3 名' },
};

/** 每台裝置各自記住版面；在畫面上提醒使用者 */
export const DEVICE_NOTE = '版面設定只存在這台裝置的瀏覽器，手機和電腦要各自設定。';

export type Layout = { side: WidgetId[]; main: WidgetId[]; hidden: WidgetId[]; phone?: WidgetId[] };

export const DEFAULT_LAYOUT: Layout = {
  side: ['weather', 'quakes', 'typhoon'],
  main: ['market', 'fuel', 'gold', 'fx', 'stock', 'gauge', 'weekly', 'calories', 'youtube', 'bargain', 'veg', 'fruit', 'fish', 'meat'],
  hidden: [],
};

/** 財經區塊：手機版預設排在天氣、地震前面 */
const FINANCE: WidgetId[] = ['market', 'fuel', 'gold', 'fx', 'stock'];

const ALL = Object.keys(WIDGETS) as WidgetId[];
const isId = (x: unknown): x is WidgetId => typeof x === 'string' && x in WIDGETS;

/**
 * 整理存起來的設定：去掉不認得的、重複的；之後新增的區塊補到預設的位置（例如市場快覽補在最上面）。
 * 存的資料壞掉也不會讓首頁出錯。
 */
export function normalize(raw: Partial<Layout> | null | undefined): Layout {
  const seen = new Set<WidgetId>();
  const clean = (list: unknown) =>
    (Array.isArray(list) ? list : []).filter((x): x is WidgetId => isId(x) && !seen.has(x) && !!seen.add(x));
  const out: Layout = { side: clean(raw?.side), main: clean(raw?.main), hidden: clean(raw?.hidden) };
  for (const id of ALL) {
    if (seen.has(id)) continue;
    const toSide = DEFAULT_LAYOUT.side.includes(id);
    const def = toSide ? DEFAULT_LAYOUT.side : DEFAULT_LAYOUT.main;
    const col = toSide ? out.side : out.main;
    // 放在預設順序裡「前一個」區塊的後面；前面沒有就放最上面
    const before = def.slice(0, def.indexOf(id)).reverse().find((x) => col.includes(x));
    col.splice(before ? col.indexOf(before) + 1 : 0, 0, id);
  }
  if (Array.isArray(raw?.phone)) {
    const p = new Set<WidgetId>();
    out.phone = raw.phone.filter((x): x is WidgetId => isId(x) && !p.has(x) && !!p.add(x) && !out.hidden.includes(x));
  }
  return out;
}

/** 由兩欄推算的手機順序：主要欄開頭的財經區塊 → 左側欄（天氣、地震）→ 其餘 */
function derivedPhone(l: Layout): WidgetId[] {
  let n = 0;
  while (n < l.main.length && FINANCE.includes(l.main[n])) n++;
  return [...l.main.slice(0, n), ...l.side, ...l.main.slice(n)];
}

/** 手機版的單欄順序 */
export function flatOrder(l: Layout): WidgetId[] {
  const visible = derivedPhone(l);
  if (!l.phone) return visible;
  const kept = l.phone.filter((id) => visible.includes(id));
  // 手機順序裡沒有的（例如剛重新顯示的）補在後面
  return [...kept, ...visible.filter((id) => !kept.includes(id))];
}

/**
 * 上移（-1）或下移（+1）。
 * flat = true（手機版）：在整條手機清單裡移動。
 * flat = false（電腦版）：只在同一欄內移動，換欄用 switchColumn。
 */
export function move(l: Layout, id: WidgetId, dir: -1 | 1, flat: boolean): Layout {
  if (flat) {
    const f = flatOrder(l);
    const i = f.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= f.length) return l;
    [f[i], f[j]] = [f[j], f[i]];
    return { ...l, phone: f };
  }
  const side = [...l.side];
  const main = [...l.main];
  const col = side.includes(id) ? side : main.includes(id) ? main : null;
  if (!col) return l;
  const i = col.indexOf(id);
  const j = i + dir;
  if (j < 0 || j >= col.length) return l;
  [col[i], col[j]] = [col[j], col[i]];
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
      ...l,
      hidden: l.hidden.filter((x) => x !== id),
      side: toSide ? [...l.side, id] : l.side,
      main: toSide ? l.main : [...l.main, id],
    };
  }
  return {
    ...l,
    side: l.side.filter((x) => x !== id),
    main: l.main.filter((x) => x !== id),
    hidden: [...l.hidden, id],
    ...(l.phone ? { phone: l.phone.filter((x) => x !== id) } : {}),
  };
}

export type Column = 'side' | 'main';

/** 電腦版拖曳放下：把區塊放到某一欄的第 index 個（index 是拿掉這個區塊之後算的） */
export function place(l: Layout, id: WidgetId, col: Column, index: number): Layout {
  const out: Layout = {
    ...l,
    side: l.side.filter((x) => x !== id),
    main: l.main.filter((x) => x !== id),
    hidden: l.hidden.filter((x) => x !== id),
  };
  const list = out[col];
  list.splice(Math.max(0, Math.min(index, list.length)), 0, id);
  return out;
}

/** 手機版拖曳放下：index 是在手機清單（拿掉這個區塊之後）的位置；不影響電腦版的兩欄 */
export function placeFlat(l: Layout, id: WidgetId, index: number): Layout {
  const f = flatOrder(l).filter((x) => x !== id);
  f.splice(Math.max(0, Math.min(index, f.length)), 0, id);
  return { ...l, phone: f };
}

/** 移到最上面：手機版是整頁最上面，電腦版是所在那一欄的最上面 */
export function toTop(l: Layout, id: WidgetId, flat: boolean): Layout {
  if (flat) return placeFlat(l, id, 0);
  return place(l, id, l.side.includes(id) ? 'side' : 'main', 0);
}

/** 可以往上／往下嗎（按鈕要不要變灰） */
export function canMove(l: Layout, id: WidgetId, dir: -1 | 1, flat: boolean) {
  const list = flat ? flatOrder(l) : l.side.includes(id) ? l.side : l.main;
  const i = list.indexOf(id);
  return i >= 0 && (dir === -1 ? i > 0 : i < list.length - 1);
}

/** 一鍵範本：套用之後還能再自己調 */
export const PRESETS: {
  key: string;
  icon: string;
  label: string;
  hint: string;
  layout: Layout;
}[] = [
  {
    key: 'commute',
    icon: '🚗',
    label: '通勤族',
    hint: '油價、天氣優先',
    layout: {
      side: ['weather', 'typhoon', 'quakes'],
      main: ['fuel', 'market', 'fx', 'stock', 'gold', 'gauge', 'weekly', 'calories', 'youtube', 'bargain', 'veg', 'fruit', 'fish', 'meat'],
      hidden: [],
    },
  },
  {
    key: 'grocery',
    icon: '🛒',
    label: '買菜族',
    hint: '划算推薦、蔬果肉魚優先',
    layout: {
      side: ['weather', 'quakes', 'typhoon'],
      main: ['bargain', 'veg', 'fruit', 'meat', 'fish', 'gauge', 'weekly', 'market', 'fuel', 'gold', 'fx', 'stock', 'calories', 'youtube'],
      hidden: [],
    },
  },
  {
    key: 'money',
    icon: '💰',
    label: '理財族',
    hint: '股市、金價、匯率優先',
    layout: {
      side: ['weather', 'quakes', 'typhoon'],
      main: ['market', 'stock', 'gold', 'fx', 'fuel', 'gauge', 'weekly', 'calories', 'youtube', 'bargain', 'veg', 'fruit', 'fish', 'meat'],
      hidden: [],
    },
  },
  {
    key: 'default',
    icon: '↺',
    label: '預設',
    hint: '回到原本的排法',
    layout: DEFAULT_LAYOUT,
  },
];

export const sameLayout = (a: Layout, b: Layout) => JSON.stringify(a) === JSON.stringify(b);
