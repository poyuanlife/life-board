import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MEALS, newId, type Combo, type Meal, type MealEntry } from '@/lib/diary';
import { GROUPS, nutritionOf, PRESETS, type Portions } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';
import { PortionGuide } from './PortionGuide';
import { Button, Chip, Input, kcalText, Stepper } from './ui';

/** 依現在時間猜是哪一餐 */
function guessMeal(): Meal {
  const h = new Date().getHours();
  if (h < 10) return '早餐';
  if (h < 14) return '午餐';
  if (h >= 17 && h < 21) return '晚餐';
  return '點心';
}

type Props = {
  combos: Combo[];
  onAdd: (entry: MealEntry) => void;
  onSaveCombo: (combo: Combo) => void;
  onRemoveCombo: (id: string) => void;
};

export function MealForm({ combos, onAdd, onSaveCombo, onRemoveCombo }: Props) {
  const t = useTheme();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [name, setName] = useState('');
  const [p, setP] = useState<Portions>({});
  const [extra, setExtra] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);

  // 等畫面載入後才看時間，避免和靜態網頁對不上
  useEffect(() => setMeal((m) => m ?? guessMeal()), []);
  const currentMeal = meal ?? '早餐';
  const extraKcal = Math.min(3000, Number(extra) || 0);
  const n = nutritionOf(p, extraKcal);
  const empty = n.kcal === 0;

  const fill = (id: string, label: string, portions: Portions, ex = 0) => {
    setPicked(id);
    setName(label);
    setP(portions);
    setExtra(ex ? String(ex) : '');
  };

  const reset = () => {
    setPicked(null);
    setName('');
    setP({});
    setExtra('');
  };

  const add = () => {
    if (empty) return;
    onAdd({ id: newId(), meal: currentMeal, name: name.trim(), p, extra: extraKcal });
    reset();
  };

  const save = () => {
    if (empty) return;
    const label = name.trim() || `組合 ${combos.length + 1}`;
    onSaveCombo({ id: newId(), name: label, p, extra: extraKcal });
    setName(label);
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.row}>
        {MEALS.map((m) => (
          <Chip key={m} label={m} on={currentMeal === m} onPress={() => setMeal(m)} />
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>快速帶入（點了可以再調整份數）</Text>
        <View style={styles.row}>
          {combos.map((c) => (
            <Chip
              key={c.id}
              label={`⭐ ${c.name}`}
              on={picked === c.id}
              onPress={() => fill(c.id, c.name, c.p, c.extra)}
              onRemove={() => onRemoveCombo(c.id)}
            />
          ))}
          {PRESETS.map((x) => (
            <Chip key={x.id} label={x.name} on={picked === x.id} onPress={() => fill(x.id, x.name, x.p, x.extra)} />
          ))}
        </View>
      </View>

      <View style={[styles.table, { borderColor: t.border }]}>
        {GROUPS.map((g, i) => {
          const v = p[g.id] ?? 0;
          return (
            <View
              key={g.id}
              style={[styles.groupRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.border }, v > 0 && { backgroundColor: t.chip }]}>
              <Text style={{ fontSize: 20 }}>{g.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>
                  {g.name}
                  <Text style={{ color: t.faint, fontSize: 12, fontWeight: '400' }}>　{g.kcal} 大卡／份</Text>
                </Text>
                <Text style={{ color: t.faint, fontSize: 12 }}>1 份 ≈ {g.example}</Text>
              </View>
              <Stepper value={v} step={0.5} label={g.short} onChange={(nv) => setP({ ...p, [g.id]: nv })} />
            </View>
          );
        })}
      </View>

      {/* 這餐合計＋換算說明 */}
      <View style={[styles.totalBox, { borderColor: t.border }]}>
        <Text style={{ color: t.text, fontSize: 15 }}>
          這餐約 <Text style={{ fontWeight: '800', fontSize: 18 }}>{kcalText(n.kcal)}</Text> 大卡
        </Text>
        <Text style={{ color: t.muted, fontSize: 13 }}>
          蛋白質 {Math.round(n.p)}g・碳水 {Math.round(n.c)}g・脂肪 {Math.round(n.f)}g
        </Text>
        <Pressable
          onPress={() => setGuide(!guide)}
          accessibilityRole="button"
          accessibilityState={{ expanded: guide }}
          style={[styles.guideBtn, { borderColor: t.accent, backgroundColor: guide ? t.chip : 'transparent' }]}>
          <Text style={{ color: t.accent, fontWeight: '600', fontSize: 14 }}>
            📖 怎麼算的？看更多份量換算例子 {guide ? '▴' : '▾'}
          </Text>
        </Pressable>
        {guide && (
          <View style={{ gap: 10, paddingTop: 4 }}>
            <PortionGuide />
            <Pressable onPress={() => setGuide(false)} style={{ alignSelf: 'center', padding: 6 }}>
              <Text style={{ color: t.accent, fontWeight: '600' }}>收起 ▴</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Input
          flex={2}
          value={name}
          onChangeText={setName}
          placeholder="這餐吃什麼（可不填）"
          accessibilityLabel="餐點名稱"
          style={{ minWidth: 160 }}
        />
        <Input
          flex={1}
          value={extra}
          onChangeText={(v) => setExtra(v.replace(/[^0-9]/g, ''))}
          placeholder="額外熱量（糖等）"
          inputMode="numeric"
          keyboardType="number-pad"
          accessibilityLabel="額外熱量，例如含糖飲料裡的糖"
          style={{ minWidth: 140 }}
        />
      </View>

      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        {!empty && <Button label="清空" ghost onPress={reset} />}
        <Button label="存成常吃組合" ghost onPress={save} disabled={empty} />
        <Button label={`加入${currentMeal}`} onPress={add} disabled={empty} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  totalBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  guideBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center', marginTop: 4 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
