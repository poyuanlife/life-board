import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  dateLabel,
  dayTotals,
  getDay,
  localDate,
  MEALS,
  setDay,
  shiftDate,
  type Day,
  type Log,
} from '@/lib/diary';
import { fmtNum, GROUPS, guideFor, nutritionOf, portionsText } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';
import { ExerciseLog, Remove, WaterLog } from './ExerciseWater';
import { MealForm } from './MealForm';
import { kcalText, Panel } from './ui';
import { WeekChart } from './WeekChart';

type Props = { log: Log; onChange: (log: Log) => void; target: number | null; weight: number | null };

export function DailyLog({ log, onChange, target, weight }: Props) {
  const t = useTheme();
  const [today, setToday] = useState('');
  const [date, setDate] = useState('');

  // 日期要在使用者的瀏覽器裡決定，不能用網站建置當天的日期
  useEffect(() => {
    const d = localDate();
    setToday(d);
    setDate(d);
  }, []);

  if (!date) return <Panel><Text style={{ color: t.faint }}>載入中…</Text></Panel>;

  const day = getDay(log, date);
  const update = (patch: Partial<Day>) => onChange(setDay(log, date, { ...day, ...patch }));
  const { portions, food, burned, net } = dayTotals(day);
  const guide = target ? guideFor(target) : null;
  const remain = target != null ? target - net : null;
  const pct = target ? Math.min(1, Math.max(0, net) / target) : 0;
  const macroKcal = food.p * 4 + food.c * 4 + food.f * 9 || 1;

  return (
    <View style={{ gap: 12 }}>
      {/* 日期切換 */}
      <View style={styles.dateBar}>
        <NavBtn label="‹ 前一天" onPress={() => setDate(shiftDate(date, -1))} />
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{dateLabel(date, today)}</Text>
        <NavBtn label="後一天 ›" onPress={() => setDate(shiftDate(date, 1))} disabled={date >= today} />
      </View>
      {date !== today && (
        <Pressable onPress={() => setDate(today)} style={{ alignSelf: 'center' }}>
          <Text style={{ color: t.accent }}>回到今天</Text>
        </Pressable>
      )}

      {/* 當日合計 */}
      <View style={[styles.summary, { backgroundColor: t.iconBg }]}>
        <View style={styles.sumRow}>
          <Stat label="吃進" value={food.kcal} />
          <Text style={[styles.op, { color: t.faint }]}>−</Text>
          <Stat label="運動消耗" value={burned} />
          <Text style={[styles.op, { color: t.faint }]}>=</Text>
          <Stat label="淨攝取" value={net} strong />
          <View style={{ flex: 1, minWidth: 160, alignItems: 'flex-end' }}>
            {remain != null ? (
              <>
                <Text style={{ color: t.muted, fontSize: 13 }}>目標 {kcalText(target!)} 大卡</Text>
                <Text style={{ color: remain < 0 ? t.up : t.text, fontWeight: '700', fontSize: 15 }}>
                  {remain < 0 ? `超過 ${kcalText(-remain)} 大卡` : `還可以吃 ${kcalText(remain)} 大卡`}
                </Text>
              </>
            ) : (
              <Text style={{ color: t.faint, fontSize: 12, textAlign: 'right' }}>在上方填好資料，就能和你的目標熱量比較</Text>
            )}
          </View>
        </View>
        {target != null && (
          <View style={[styles.bar, { backgroundColor: t.border }]}>
            <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: remain! < 0 ? t.up : t.down }} />
          </View>
        )}

        {/* 三大營養素 */}
        <View style={styles.macros}>
          <Macro label="蛋白質" g={food.p} pct={(food.p * 4) / macroKcal} />
          <Macro label="碳水化合物" g={food.c} pct={(food.c * 4) / macroKcal} />
          <Macro label="脂肪" g={food.f} pct={(food.f * 9) / macroKcal} />
        </View>
        {weight && (
          <Text style={{ color: t.faint, fontSize: 12 }}>
            蛋白質建議每天至少 {Math.round(weight * 1)}～{Math.round(weight * 1.2)} 公克（體重 × 1～1.2）；有在重訓可到體重 × 1.6。
          </Text>
        )}

        {/* 份數 vs 建議 */}
        <View style={styles.groups}>
          {GROUPS.map((g) => {
            const have = portions[g.id] ?? 0;
            const need = guide?.p[g.id];
            // 油脂是「不要超過」，其他類是「要吃夠」
            const tone =
              need == null ? t.border : g.id === 'fat' ? (have > need ? t.up : t.border) : have >= need ? t.down : t.border;
            return (
              <View key={g.id} style={[styles.groupTile, { backgroundColor: t.card, borderColor: tone }]}>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {g.icon} {g.short}
                </Text>
                <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                  {fmtNum(have)}
                  {need != null && <Text style={{ color: t.faint, fontWeight: '400', fontSize: 12 }}> / {fmtNum(need)} 份</Text>}
                </Text>
              </View>
            );
          })}
        </View>
        {guide && (
          <Text style={{ color: t.faint, fontSize: 12 }}>
            建議份數參考國健署《每日飲食指南》{guide.kcal.toLocaleString('en-US')} 大卡等級。綠框代表已吃夠；油脂變紅框代表吃太多了。
          </Text>
        )}
      </View>

      {/* 今天吃了什麼 */}
      {day.meals.length > 0 && (
        <Panel title="🍽️ 吃了什麼">
          {MEALS.map((m) => {
            const list = day.meals.filter((e) => e.meal === m);
            if (!list.length) return null;
            return (
              <View key={m} style={{ gap: 4 }}>
                <Text style={{ color: t.muted, fontSize: 13, fontWeight: '700' }}>{m}</Text>
                {list.map((e) => (
                  <View key={e.id} style={styles.item}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.text }}>{e.name || portionsText(e.p) || '額外熱量'}</Text>
                      <Text style={{ color: t.faint, fontSize: 12 }}>
                        {portionsText(e.p)}
                        {e.extra ? `${portionsText(e.p) ? '・' : ''}額外 ${e.extra} 大卡` : ''}
                      </Text>
                    </View>
                    <Text style={{ color: t.text, fontWeight: '600' }}>{kcalText(nutritionOf(e.p, e.extra).kcal)} 大卡</Text>
                    <Remove label={e.name || m} onPress={() => update({ meals: day.meals.filter((x) => x.id !== e.id) })} />
                  </View>
                ))}
              </View>
            );
          })}
        </Panel>
      )}

      <Panel title="➕ 記錄一餐">
        <MealForm
          combos={log.combos}
          onAdd={(entry) => update({ meals: [...day.meals, entry] })}
          onSaveCombo={(c) => onChange({ ...log, combos: [c, ...log.combos].slice(0, 20) })}
          onRemoveCombo={(id) => onChange({ ...log, combos: log.combos.filter((c) => c.id !== id) })}
        />
      </Panel>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <ExerciseLog list={day.exercise} weight={weight} onChange={(exercise) => update({ exercise })} />
        </View>
        <View style={styles.col}>
          <WaterLog ml={day.water} weight={weight} onChange={(water) => update({ water })} />
        </View>
      </View>

      <WeekChart log={log} end={date} target={target} onPick={setDate} />
    </View>
  );
}

function NavBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.navBtn, { borderColor: t.border, backgroundColor: t.card, opacity: disabled ? 0.35 : 1 }]}>
      <Text style={{ color: t.text }}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: strong ? t.accent : t.text, fontSize: strong ? 26 : 20, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
        {kcalText(value)}
      </Text>
    </View>
  );
}

function Macro({ label, g, pct }: { label: string; g: number; pct: number }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2 }}>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: t.text, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
        {Math.round(g)} 公克
        <Text style={{ color: t.faint, fontWeight: '400', fontSize: 12 }}> {g > 0 ? `${Math.round(pct * 100)}%` : ''}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  navBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  summary: { borderRadius: 16, padding: 16, gap: 12 },
  sumRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 },
  op: { fontSize: 20, paddingBottom: 2 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupTile: { flexGrow: 1, flexBasis: 90, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flexGrow: 1, flexBasis: 320 },
});
