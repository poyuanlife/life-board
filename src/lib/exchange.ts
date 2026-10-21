// 份數制飲食計算：依衛福部「食物代換表」，每一份食物的熱量與三大營養素都是固定的估計值

export type GroupId = 'grain' | 'protein' | 'dairy' | 'veg' | 'fruit' | 'fat';

export type Portions = Partial<Record<GroupId, number>>;

type Group = {
  id: GroupId;
  name: string;
  short: string;
  icon: string;
  kcal: number;
  p: number; // 蛋白質（公克）
  c: number; // 碳水化合物（公克）
  f: number; // 脂肪（公克）
  example: string; // 1 份大約是多少
};

export const GROUPS: Group[] = [
  { id: 'grain', name: '全穀雜糧（澱粉）', short: '澱粉', icon: '🍚', kcal: 70, p: 2, c: 15, f: 0, example: '白飯 1/4 碗、薄吐司 1 片、饅頭 1/3 個' },
  { id: 'protein', name: '豆魚蛋肉（蛋白質）', short: '蛋白質', icon: '🍗', kcal: 75, p: 7, c: 0, f: 5, example: '雞蛋 1 顆、肉或魚約 3 根手指大、無糖豆漿 1 杯' },
  { id: 'veg', name: '蔬菜', short: '蔬菜', icon: '🥦', kcal: 25, p: 1, c: 5, f: 0, example: '煮熟約半碗（生的約 100 公克）' },
  { id: 'fruit', name: '水果', short: '水果', icon: '🍎', kcal: 60, p: 0, c: 15, f: 0, example: '約 1 個拳頭大、切塊約 1 碗、香蕉半根' },
  { id: 'dairy', name: '乳品', short: '乳品', icon: '🥛', kcal: 150, p: 8, c: 12, f: 8, example: '鮮奶 1 杯（240 毫升）、起司 2 片' },
  { id: 'fat', name: '油脂與堅果', short: '油脂', icon: '🥜', kcal: 45, p: 0, c: 0, f: 5, example: '油 1 茶匙、花生約 10 粒、腰果 5 粒' },
];

export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<GroupId, Group>;

export type Nutrition = { kcal: number; p: number; c: number; f: number };

/** 把份數換算成熱量與三大營養素；extra 是額外熱量（例如飲料裡的糖），算在碳水 */
export function nutritionOf(portions: Portions, extra = 0): Nutrition {
  const n = { kcal: extra, p: 0, c: extra / 4, f: 0 };
  for (const g of GROUPS) {
    const k = portions[g.id] ?? 0;
    n.kcal += g.kcal * k;
    n.p += g.p * k;
    n.c += g.c * k;
    n.f += g.f * k;
  }
  return n;
}

export function addPortions(a: Portions, b: Portions): Portions {
  const out: Portions = { ...a };
  for (const g of GROUPS) out[g.id] = (a[g.id] ?? 0) + (b[g.id] ?? 0);
  return out;
}

/** 份數的文字，例如「澱粉 4・蛋白質 2」 */
export function portionsText(p: Portions) {
  return GROUPS.filter((g) => (p[g.id] ?? 0) > 0)
    .map((g) => `${g.short} ${fmtNum(p[g.id] ?? 0)}`)
    .join('・');
}

export function fmtNum(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

// 國健署《每日飲食指南》各熱量等級的建議份數（油脂與堅果合併）
const GUIDE: { kcal: number; p: Required<Portions> }[] = [
  { kcal: 1200, p: { grain: 6, protein: 3, veg: 3, fruit: 2, dairy: 1.5, fat: 4 } },
  { kcal: 1500, p: { grain: 10, protein: 4, veg: 3, fruit: 2, dairy: 1.5, fat: 4 } },
  { kcal: 1800, p: { grain: 12, protein: 5, veg: 3, fruit: 2, dairy: 1.5, fat: 5 } },
  { kcal: 2000, p: { grain: 12, protein: 6, veg: 4, fruit: 3, dairy: 1.5, fat: 6 } },
  { kcal: 2200, p: { grain: 14, protein: 6, veg: 4, fruit: 3.5, dairy: 1.5, fat: 6 } },
  { kcal: 2500, p: { grain: 16, protein: 7, veg: 5, fruit: 4, dairy: 1.5, fat: 7 } },
  { kcal: 2700, p: { grain: 16, protein: 8, veg: 5, fruit: 4, dairy: 2, fat: 8 } },
];

/** 找最接近目標熱量的建議份數 */
export function guideFor(kcal: number) {
  return GUIDE.reduce((best, g) => (Math.abs(g.kcal - kcal) < Math.abs(best.kcal - kcal) ? g : best));
}

// 常見外食，一鍵加入（份數為一般份量的粗估）
export type Preset = { id: string; name: string; p: Portions; extra?: number };

export const PRESETS: Preset[] = [
  { id: 'rice', name: '白飯 1 碗', p: { grain: 4 } },
  { id: 'bento', name: '雞腿便當', p: { grain: 4, protein: 3, veg: 1.5, fat: 5 } },
  { id: 'luroufan', name: '滷肉飯（小）', p: { grain: 3, protein: 1, fat: 3 } },
  { id: 'beefnoodle', name: '牛肉麵', p: { grain: 4, protein: 3, veg: 0.5, fat: 3 } },
  { id: 'danbing', name: '蛋餅', p: { grain: 2, protein: 1, fat: 2 } },
  { id: 'sandwich', name: '鮪魚三明治', p: { grain: 2, protein: 1, fat: 2 } },
  { id: 'onigiri', name: '御飯糰', p: { grain: 2.5, protein: 0.5, fat: 1 } },
  { id: 'teaegg', name: '茶葉蛋', p: { protein: 1 } },
  { id: 'veg', name: '燙青菜', p: { veg: 1, fat: 1 } },
  { id: 'saltchicken', name: '鹽酥雞（中份）', p: { grain: 1, protein: 3, fat: 6 } },
  { id: 'milktea', name: '鮮奶茶（中杯半糖）', p: { dairy: 1 }, extra: 70 },
  { id: 'bubbletea', name: '珍珠奶茶（大杯全糖）', p: { grain: 2.5, fat: 3 }, extra: 200 },
  { id: 'milk', name: '鮮奶 1 杯', p: { dairy: 1 } },
  { id: 'fruit', name: '水果 1 份', p: { fruit: 1 } },
];

// 運動消耗：MET × 體重（公斤）× 小時
export const EXERCISES: { name: string; met: number }[] = [
  { name: '散步', met: 3 },
  { name: '快走', met: 4.3 },
  { name: '慢跑', met: 7 },
  { name: '騎腳踏車', met: 6.8 },
  { name: '游泳', met: 6 },
  { name: '重量訓練', met: 5 },
  { name: '跳繩', met: 11 },
  { name: '爬樓梯', met: 8 },
  { name: '瑜伽', met: 2.5 },
  { name: '羽球', met: 5.5 },
  { name: '籃球', met: 6.5 },
  { name: '做家事', met: 3 },
];

export function exerciseKcal(met: number, weightKg: number, minutes: number) {
  return Math.round(met * weightKg * (minutes / 60));
}

/**
 * 蛋白質 CP 值：看板上的價格是「整隻、整顆、帶骨帶殼」的產地／批發價，
 * 這裡估算要買多少公克才有 1 份蛋白質（7 公克），已扣掉骨頭、殼、內臟等不能吃的部分。
 */
export const PROTEIN_SOURCES: { id: string; grams: number; serving: string }[] = [
  { id: 'egg', grams: 60, serving: '1 顆蛋' },
  { id: 'chicken', grams: 70, serving: '約 35 公克雞肉' },
  { id: 'pork', grams: 70, serving: '約 35 公克豬肉' },
  { id: 'milkfish', grams: 64, serving: '約 35 公克魚肉' },
  { id: 'tilapia', grams: 78, serving: '約 35 公克魚肉' },
  { id: 'threadfin', grams: 64, serving: '約 35 公克魚肉' },
  { id: 'hairtail', grams: 58, serving: '約 35 公克魚肉' },
  { id: 'shrimp', grams: 100, serving: '約 50 公克蝦仁' },
  { id: 'oyster', grams: 65, serving: '約 65 公克蚵仔' },
];
