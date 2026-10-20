// 常見食物熱量參考表（一般份量的估計值，實際會因店家、做法與份量不同）

export type Food = { id: string; name: string; serving: string; kcal: number; group: FoodGroup };

export type FoodGroup = '主食' | '外食' | '早餐' | '飲料' | '水果' | '肉蛋豆' | '點心';

export const FOOD_GROUPS: FoodGroup[] = ['主食', '外食', '早餐', '飲料', '水果', '肉蛋豆', '點心'];

const f = (group: FoodGroup) => (id: string, name: string, serving: string, kcal: number): Food => ({
  id,
  name,
  serving,
  kcal,
  group,
});

const staple = f('主食');
const meal = f('外食');
const bfast = f('早餐');
const drink = f('飲料');
const fruit = f('水果');
const protein = f('肉蛋豆');
const snack = f('點心');

export const FOODS: Food[] = [
  staple('rice', '白飯', '1 碗（約 160 公克）', 280),
  staple('brownrice', '糙米飯', '1 碗（約 160 公克）', 260),
  staple('congee', '白粥', '1 碗（約 250 公克）', 120),
  staple('toast', '白吐司', '1 片', 80),
  staple('mantou', '白饅頭', '1 個', 280),
  staple('sweetpotato', '地瓜', '1 條（約 150 公克）', 170),
  staple('noodle', '陽春麵', '1 碗', 350),
  staple('dumpling', '水餃', '1 顆', 50),

  meal('chickenbento', '雞腿便當', '1 個', 850),
  meal('porkbento', '排骨便當', '1 個', 900),
  meal('braisedrice', '滷肉飯', '1 小碗', 350),
  meal('beefnoodle', '紅燒牛肉麵', '1 碗', 600),
  meal('friedrice', '炒飯', '1 盤', 650),
  meal('chickencutlet', '炸雞排', '1 片', 650),
  meal('omelet', '蚵仔煎', '1 份', 450),
  meal('potsticker', '鍋貼', '1 顆', 60),
  meal('hotpot', '小火鍋（含主食）', '1 份', 800),
  meal('saltychicken', '鹽酥雞', '1 小包（約 150 公克）', 450),

  bfast('eggpancake', '原味蛋餅', '1 份', 250),
  bfast('sandwich', '火腿蛋三明治', '1 份', 300),
  bfast('riceball', '飯糰', '1 個', 450),
  bfast('shaobing', '燒餅油條', '1 份', 450),
  bfast('radishcake', '煎蘿蔔糕', '2 片', 250),
  bfast('burger', '豬肉堡（含蛋）', '1 個', 400),

  drink('bubbletea', '珍珠奶茶（全糖）', '大杯 700 毫升', 650),
  drink('bubbletealow', '珍珠奶茶（半糖）', '大杯 700 毫升', 480),
  drink('greentea', '無糖綠茶', '1 杯', 0),
  drink('latte', '拿鐵（全脂）', '中杯', 200),
  drink('americano', '美式咖啡', '1 杯', 10),
  drink('cola', '可樂', '1 罐 330 毫升', 140),
  drink('soymilk', '含糖豆漿', '1 杯 400 毫升', 180),
  drink('milk', '鮮奶', '1 杯 240 毫升', 150),
  drink('beer', '啤酒', '1 罐 330 毫升', 140),

  fruit('banana', '香蕉', '1 根', 100),
  fruit('guava', '芭樂', '1 顆', 90),
  fruit('apple', '蘋果', '1 顆', 105),
  fruit('watermelon', '西瓜', '1 片（約 250 公克）', 80),
  fruit('papaya', '木瓜', '1 碗（約 150 公克）', 60),
  fruit('pineapple', '鳳梨', '1 碗（約 150 公克）', 80),

  protein('egg', '水煮蛋／茶葉蛋', '1 顆', 75),
  protein('chickenbreast', '雞胸肉（熟）', '100 公克', 165),
  protein('tofu', '板豆腐', '1 塊（約 140 公克）', 120),
  protein('salmon', '鮭魚（熟）', '100 公克', 200),
  protein('milkfish', '虱目魚肚（煎）', '1 片', 300),
  protein('porkchop', '滷排骨', '1 片', 300),

  snack('chips', '洋芋片', '1 包（約 60 公克）', 330),
  snack('chocolate', '巧克力', '1 片（約 45 公克）', 240),
  snack('cake', '蛋糕', '1 片', 350),
  snack('icecream', '冰淇淋', '1 球', 150),
  snack('nuts', '綜合堅果', '1 小把（約 30 公克）', 180),
];
