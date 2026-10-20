import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FOOD_GROUPS, FOODS, type Food, type FoodGroup } from '@/lib/foods';
import { useTheme } from '@/lib/theme';

export type Diary = {
  counts: Record<string, number>; // 食物 id → 份數
  custom: Food[]; // 使用者自己加的食物
};

export const EMPTY_DIARY: Diary = { counts: {}, custom: [] };

type Props = { diary: Diary; onChange: (d: Diary) => void; target: number | null };

export function CalorieTable({ diary, onChange, target }: Props) {
  const t = useTheme();
  const [group, setGroup] = useState<FoodGroup | '全部' | '自訂'>('全部');
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');

  const all = useMemo(() => [...FOODS, ...diary.custom], [diary.custom]);
  const byId = useMemo(() => new Map(all.map((f) => [f.id, f])), [all]);

  const selected = Object.entries(diary.counts)
    .filter(([id, n]) => n > 0 && byId.has(id))
    .map(([id, n]) => ({ food: byId.get(id)!, n }));
  const total = selected.reduce((s, x) => s + x.food.kcal * x.n, 0);

  const [expanded, setExpanded] = useState(false);
  const filtered = all.filter((food) => {
    if (query.trim()) return food.name.includes(query.trim());
    if (group === '全部') return true;
    if (group === '自訂') return food.id.startsWith('custom-');
    return food.group === group && !food.id.startsWith('custom-');
  });
  // 「全部」時預設只列前 12 項，避免頁面太長
  const PREVIEW = 12;
  const collapsed = group === '全部' && !query.trim() && !expanded && filtered.length > PREVIEW;
  const list = collapsed ? filtered.slice(0, PREVIEW) : filtered;

  const setCount = (id: string, n: number) => onChange({ ...diary, counts: { ...diary.counts, [id]: Math.max(0, n) } });

  const addCustom = () => {
    const kcal = Number(customKcal);
    if (!customName.trim() || !(kcal >= 0 && kcal <= 5000)) return;
    const food: Food = { id: `custom-${Date.now()}`, name: customName.trim(), serving: '1 份', kcal: Math.round(kcal), group: '點心' };
    onChange({ custom: [...diary.custom, food], counts: { ...diary.counts, [food.id]: 1 } });
    setCustomName('');
    setCustomKcal('');
  };

  const removeCustom = (id: string) => {
    const { [id]: _, ...counts } = diary.counts;
    onChange({ custom: diary.custom.filter((f) => f.id !== id), counts });
  };

  const pct = target ? Math.min(1, total / target) : 0;
  const over = target != null && total > target;

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      {/* 今日合計 */}
      <View style={[styles.summary, { backgroundColor: t.iconBg }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={{ color: t.muted, fontSize: 13 }}>今天吃了</Text>
            <Text style={[styles.total, { color: t.text }]}>
              {total.toLocaleString('en-US')}
              <Text style={{ fontSize: 14, fontWeight: '400', color: t.muted }}> 大卡</Text>
            </Text>
          </View>
          {target != null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: t.muted, fontSize: 13 }}>目標（維持體重）{target.toLocaleString('en-US')} 大卡</Text>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                {over ? `超過 ${(total - target).toLocaleString('en-US')} 大卡` : `還可以吃 ${(target - total).toLocaleString('en-US')} 大卡`}
              </Text>
            </View>
          ) : (
            <Text style={{ color: t.faint, fontSize: 12, maxWidth: 200, textAlign: 'right' }}>在上方填好資料，就能和你的 TDEE 比較</Text>
          )}
        </View>
        {target != null && (
          <View style={[styles.bar, { backgroundColor: t.border }]}>
            <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: over ? t.up : t.down }} />
          </View>
        )}
        {selected.length > 0 && (
          <View style={styles.picked}>
            {selected.map(({ food, n }) => (
              <Text key={food.id} style={[styles.pill, { backgroundColor: t.card, color: t.text, borderColor: t.border }]}>
                {food.name} ×{n}・{(food.kcal * n).toLocaleString('en-US')}
              </Text>
            ))}
            <Pressable onPress={() => onChange({ ...diary, counts: {} })}>
              <Text style={{ color: t.accent, fontSize: 13, paddingVertical: 4 }}>全部清除</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 搜尋與分類 */}
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋食物，例如：珍奶、便當"
        placeholderTextColor={t.faint}
        style={[styles.search, { borderColor: t.border, color: t.text, backgroundColor: t.bg }]}
        accessibilityLabel="搜尋食物"
      />
      <View style={styles.chips}>
        {(['全部', ...FOOD_GROUPS, ...(diary.custom.length ? (['自訂'] as const) : [])] as const).map((g) => {
          const on = group === g && !query;
          return (
            <Pressable
              key={g}
              onPress={() => {
                setGroup(g);
                setQuery('');
              }}
              style={[styles.chip, { backgroundColor: on ? t.accent : t.chip }]}>
              <Text style={{ color: on ? '#fff' : t.text, fontSize: 13 }}>{g}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 食物列表 */}
      <View style={[styles.table, { borderColor: t.border }]}>
        {list.length === 0 && <Text style={{ color: t.faint, padding: 12 }}>找不到「{query}」，可以在下方自己新增。</Text>}
        {list.map((food, i) => {
          const n = diary.counts[food.id] ?? 0;
          const custom = food.id.startsWith('custom-');
          return (
            <View
              key={food.id}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }, n > 0 && { backgroundColor: t.chip }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15 }}>{food.name}</Text>
                <Text style={{ color: t.faint, fontSize: 12 }}>
                  {food.serving}
                  {custom ? '・自訂' : ''}
                </Text>
              </View>
              <Text style={[styles.kcal, { color: t.text }]}>{food.kcal}</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => (n === 0 && custom ? removeCustom(food.id) : setCount(food.id, n - 1))}
                  style={[styles.stepBtn, { borderColor: t.border, opacity: n === 0 && !custom ? 0.35 : 1 }]}
                  accessibilityLabel={n === 0 && custom ? `刪除${food.name}` : `減少${food.name}`}>
                  <Text style={{ color: t.text, fontSize: 16 }}>{n === 0 && custom ? '×' : '−'}</Text>
                </Pressable>
                <Text style={[styles.count, { color: t.text }]}>{n}</Text>
                <Pressable
                  onPress={() => setCount(food.id, n + 1)}
                  style={[styles.stepBtn, { borderColor: t.accent, backgroundColor: t.accent }]}
                  accessibilityLabel={`增加${food.name}`}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        {collapsed && (
          <Pressable
            onPress={() => setExpanded(true)}
            style={[styles.more, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }]}>
            <Text style={{ color: t.accent, fontWeight: '600' }}>顯示全部 {filtered.length} 項 ▾</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: t.faint, fontSize: 12 }}>熱量單位：大卡／份。數值為一般份量的參考估計，實際會因店家、做法和份量而不同。</Text>

      {/* 自訂食物 */}
      <View style={styles.customRow}>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="自訂食物名稱"
          placeholderTextColor={t.faint}
          style={[styles.search, { flex: 2, borderColor: t.border, color: t.text, backgroundColor: t.bg }]}
          accessibilityLabel="自訂食物名稱"
        />
        <TextInput
          value={customKcal}
          onChangeText={(v) => setCustomKcal(v.replace(/[^0-9]/g, ''))}
          placeholder="大卡"
          inputMode="numeric"
          keyboardType="number-pad"
          placeholderTextColor={t.faint}
          style={[styles.search, { flex: 1, borderColor: t.border, color: t.text, backgroundColor: t.bg }]}
          accessibilityLabel="自訂食物熱量"
        />
        <Pressable onPress={addCustom} style={[styles.addBtn, { backgroundColor: t.accent }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>新增</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  summary: { borderRadius: 12, padding: 14, gap: 10 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' },
  total: { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  picked: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  pill: { fontSize: 12, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  kcal: { width: 48, textAlign: 'right', fontWeight: '600', fontVariant: ['tabular-nums'] },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  count: { width: 22, textAlign: 'center', fontVariant: ['tabular-nums'], fontWeight: '600' },
  more: { alignItems: 'center', paddingVertical: 12 },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
});
