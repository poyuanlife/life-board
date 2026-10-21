import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DIETS, GROUPS, guideFor, nutritionOf, scaleDiet, type Portions } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';
import { Button, Chip, kcalText, Stepper } from './ui';

type Props = {
  initial: Portions; // 打開時預先填入的份數（目前的自訂或國健署建議）
  initialName?: string;
  hasPlan: boolean;
  target: number | null;
  onSave: (plan: Portions, name: string) => void;
  onReset: () => void;
  onClose: () => void;
};

const BALANCED = { id: 'balanced', name: '國健署均衡' };

/** 自訂每日份數：可一鍵套用常見飲食法，再自己微調 */
export function PlanEditor({ initial, initialName, hasPlan, target, onSave, onReset, onClose }: Props) {
  const t = useTheme();
  const [p, setP] = useState<Portions>(initial);
  const [picked, setPicked] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const kcal = nutritionOf(p).kcal;
  const diet = DIETS.find((d) => d.id === picked);

  const apply = (id: string) => {
    setPicked(id);
    setEdited(false);
    if (id === BALANCED.id) setP(guideFor(target ?? 1800).p);
    else setP(scaleDiet(DIETS.find((d) => d.id === id)!, target));
  };

  const pickedName = picked === BALANCED.id ? BALANCED.name : diet?.name;
  const name = pickedName ? (edited ? `${pickedName}・微調` : pickedName) : (initialName ?? '自訂');

  return (
    <View style={[styles.box, { backgroundColor: t.card, borderColor: t.accent }]}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>⚙️ 自訂每日份數</Text>
      <Text style={{ color: t.muted, fontSize: 13, lineHeight: 20 }}>
        點一個飲食法就會自動填好份數{target ? `（已依你的目標 ${kcalText(target)} 大卡調整）` : ''}，也可以再用 + − 微調，或直接填營養師給你的份數。
      </Text>

      <View style={styles.chips}>
        {[BALANCED, ...DIETS].map((d) => (
          <Chip key={d.id} label={d.name} on={picked === d.id} onPress={() => apply(d.id)} />
        ))}
      </View>

      {picked === BALANCED.id && (
        <View style={[styles.note, { backgroundColor: t.iconBg }]}>
          <Text style={{ color: t.text, fontSize: 13, lineHeight: 20 }}>國健署《每日飲食指南》給一般成人的均衡建議，各類食物都吃到。</Text>
        </View>
      )}
      {diet && (
        <View style={[styles.note, { backgroundColor: t.iconBg }]}>
          <Text style={{ color: t.text, fontSize: 13, lineHeight: 20 }}>{diet.desc}</Text>
          {diet.tips.map((tip) => (
            <Text key={tip} style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
              • {tip}
            </Text>
          ))}
        </View>
      )}

      <View style={{ gap: 2 }}>
        {GROUPS.map((g) => (
          <View key={g.id} style={styles.row}>
            <Text style={{ fontSize: 18 }}>{g.icon}</Text>
            <Text style={{ color: t.text, flex: 1 }}>
              {g.name}
              {g.id === 'grain' && (p.grain ?? 0) > 0 && (
                <Text style={{ color: t.faint, fontSize: 12 }}>　約 {fmtBowls(p.grain ?? 0)} 碗飯</Text>
              )}
            </Text>
            <Stepper
              value={p[g.id] ?? 0}
              step={0.5}
              label={g.short}
              onChange={(v) => {
                setP({ ...p, [g.id]: v });
                setEdited(true);
              }}
            />
          </View>
        ))}
      </View>

      <Text style={{ color: t.muted, fontSize: 13 }}>
        照這個份數吃，一天約 <Text style={{ color: t.text, fontWeight: '700' }}>{kcalText(kcal)} 大卡</Text>
        {target != null && `（你的目標是 ${kcalText(target)} 大卡）`}
      </Text>
      {target != null && kcal > 0 && Math.abs(kcal - target) > 300 && (
        <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
          ※ 和目標熱量差了 {kcalText(Math.abs(kcal - target))} 大卡。如果份數是營養師幫你訂的，以營養師的建議為準；也可以回到上方檢查目標和活動量有沒有選對。
        </Text>
      )}

      <View style={styles.btns}>
        {hasPlan && <Button label="改回國健署建議" ghost onPress={onReset} />}
        <Button label="取消" ghost onPress={onClose} />
        <Button label="儲存" onPress={() => onSave(p, name)} disabled={kcal === 0} />
      </View>
    </View>
  );
}

/** 4 份澱粉 = 1 碗飯 */
export function fmtBowls(portions: number) {
  const b = Math.round((portions / 4) * 4) / 4; // 取到 1/4 碗
  const whole = Math.floor(b);
  const frac = { 0: '', 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' }[b - whole] ?? '';
  if (!whole) return frac || '0';
  return frac ? `${whole} 又 ${frac}` : String(whole);
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { borderRadius: 10, padding: 10, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
});
