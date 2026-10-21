import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ACTIVITY, bmi, bmiLevel, bmr, tdee, type Sex } from '@/lib/energy';
import { useTheme } from '@/lib/theme';

export type GoalId = 'cut' | 'keep' | 'bulk';

export type Profile = { sex: Sex; age: string; height: string; weight: string; activity: number; goal: GoalId };

export const DEFAULT_PROFILE: Profile = { sex: 'female', age: '', height: '', weight: '', activity: 1, goal: 'keep' };

export const GOALS: { id: GoalId; label: string; hint: string }[] = [
  { id: 'cut', label: '減脂', hint: 'TDEE − 500，約每週減 0.5 公斤' },
  { id: 'keep', label: '維持體重', hint: '吃多少就消耗多少' },
  { id: 'bulk', label: '增肌', hint: 'TDEE + 300，搭配重量訓練' },
];

function goalKcal(goal: GoalId, b: number, t: number) {
  if (goal === 'cut') return Math.max(t - 500, b); // 不低於基礎代謝
  if (goal === 'bulk') return t + 300;
  return t;
}

/** 輸入都合理才回傳計算結果 */
export function computeEnergy(p: Profile) {
  const age = Number(p.age);
  const h = Number(p.height);
  const w = Number(p.weight);
  if (!(age >= 10 && age <= 100 && h >= 100 && h <= 230 && w >= 25 && w <= 250)) return null;
  const b = bmr(p.sex, age, h, w);
  const t = tdee(b, ACTIVITY[p.activity].factor);
  const goal = GOALS.some((g) => g.id === p.goal) ? p.goal : 'keep';
  return { bmr: b, tdee: t, bmi: bmi(h, w), weight: w, goal, target: goalKcal(goal, b, t) };
}

export function EnergyCalculator({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const t = useTheme();
  const result = computeEnergy(profile);
  const set = (patch: Partial<Profile>) => onChange({ ...profile, ...patch });

  const field = (key: 'age' | 'height' | 'weight', label: string, unit: string, placeholder: string) => (
    <View style={[styles.field, styles.fieldInRow]}>
      <Text style={[styles.label, { color: t.muted }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: t.border, backgroundColor: t.bg }]}>
        <TextInput
          value={profile[key]}
          onChangeText={(v) => set({ [key]: v.replace(/[^0-9.]/g, '') })}
          inputMode="decimal"
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={t.faint}
          style={[styles.input, { color: t.text }]}
          accessibilityLabel={label}
        />
        <Text style={{ color: t.faint, fontSize: 13 }}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.cols}>
        {/* 左：輸入 */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: t.muted }]}>性別</Text>
            <View style={styles.segment}>
              {(
                [
                  ['female', '女性'],
                  ['male', '男性'],
                ] as const
              ).map(([v, label]) => {
                const on = profile.sex === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => set({ sex: v })}
                    style={[styles.segBtn, { borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accent : t.bg }]}>
                    <Text style={{ color: on ? '#fff' : t.text, fontWeight: on ? '700' : '400' }}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.row3}>
            {field('age', '年齡', '歲', '30')}
            {field('height', '身高', '公分', '165')}
            {field('weight', '體重', '公斤', '60')}
          </View>
          <View style={styles.field}>
            <Text style={[styles.label, { color: t.muted }]}>活動量</Text>
            <View style={{ gap: 6 }}>
              {ACTIVITY.map((a, i) => {
                const on = profile.activity === i;
                return (
                  <Pressable
                    key={a.label}
                    onPress={() => set({ activity: i })}
                    style={[styles.option, { borderColor: on ? t.accent : t.border, backgroundColor: on ? t.chip : t.bg }]}>
                    <View style={[styles.radio, { borderColor: on ? t.accent : t.faint }]}>
                      {on && <View style={[styles.radioDot, { backgroundColor: t.accent }]} />}
                    </View>
                    <Text style={{ color: t.text, fontWeight: '600', width: 72 }}>{a.label}</Text>
                    <Text style={{ color: t.muted, fontSize: 13, flex: 1 }}>{a.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* 右：結果 */}
        <View style={[styles.result, { backgroundColor: t.iconBg }]}>
          {!result ? (
            <Text style={{ color: t.muted, lineHeight: 22 }}>輸入年齡、身高、體重後，這裡會顯示你的基礎代謝率與每日建議熱量。</Text>
          ) : (
            <>
              <View style={styles.bigRow}>
                <Big label="基礎代謝 BMR" value={result.bmr} />
                <Big label="每日總消耗 TDEE" value={result.tdee} strong />
              </View>
              <View style={styles.bmiRow}>
                <Text style={{ color: t.muted, fontSize: 13 }}>BMI</Text>
                <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{result.bmi}</Text>
                <View style={[styles.dot, { backgroundColor: t[bmiLevel(result.bmi).tone] }]} />
                <Text style={{ color: t.text, fontSize: 13 }}>{bmiLevel(result.bmi).label}</Text>
                <Text style={{ color: t.faint, fontSize: 11 }}>（健康範圍 18.5～24）</Text>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ color: t.muted, fontSize: 13 }}>選擇你的目標（下方紀錄會用這個熱量）</Text>
                {GOALS.map((g) => (
                  <Goal
                    key={g.id}
                    label={g.label}
                    hint={g.hint}
                    kcal={goalKcal(g.id, result.bmr, result.tdee)}
                    on={result.goal === g.id}
                    onPress={() => set({ goal: g.id })}
                  />
                ))}
              </View>
              {result.tdee - 500 < result.bmr && (
                <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
                  ※ 減脂熱量已調整為不低於基礎代謝率，長期吃得比 BMR 還少容易影響健康。
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function Big({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: strong ? t.accent : t.text, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {value.toLocaleString('en-US')}
        <Text style={{ fontSize: 14, fontWeight: '400', color: t.muted }}> 大卡</Text>
      </Text>
    </View>
  );
}

function Goal(props: { label: string; kcal: number; hint: string; on: boolean; onPress: () => void }) {
  const { label, kcal, hint, on, onPress } = props;
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={[styles.goal, { backgroundColor: on ? t.chip : t.card, borderColor: on ? t.accent : t.border }]}>
      <View style={[styles.radio, { borderColor: on ? t.accent : t.faint }]}>
        {on && <View style={[styles.radioDot, { backgroundColor: t.accent }]} />}
      </View>
      <Text style={{ color: t.text, fontWeight: '700', width: 64 }}>{label}</Text>
      <Text style={{ color: t.muted, fontSize: 12, flex: 1 }}>{hint}</Text>
      <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{kcal.toLocaleString('en-US')} 大卡</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cols: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  form: { flexGrow: 1, flexBasis: 320, gap: 14 },
  result: { flexGrow: 1, flexBasis: 320, borderRadius: 12, padding: 16, gap: 14, justifyContent: 'center' },
  field: { gap: 6 },
  fieldInRow: { flexGrow: 1, flexBasis: 90 }, // 只用在橫排；直排時 flexBasis 會變成固定高度
  label: { fontSize: 13 },
  row3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, gap: 6 },
  input: { flex: 1, fontSize: 16, paddingVertical: 9, minWidth: 40 },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  bigRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
});
