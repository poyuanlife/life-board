import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GROUPS, nutritionOf, type Portions } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';
import { Button, kcalText, Stepper } from './ui';

type Props = {
  initial: Portions; // 打開時預先填入的份數（目前的自訂或國健署建議）
  hasPlan: boolean;
  target: number | null;
  onSave: (plan: Portions) => void;
  onReset: () => void;
  onClose: () => void;
};

/** 自訂每日份數，例如營養師給的減脂菜單 */
export function PlanEditor({ initial, hasPlan, target, onSave, onReset, onClose }: Props) {
  const t = useTheme();
  const [p, setP] = useState<Portions>(initial);
  const kcal = nutritionOf(p).kcal;

  return (
    <View style={[styles.box, { backgroundColor: t.card, borderColor: t.accent }]}>
      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>⚙️ 自訂每日份數</Text>
      <Text style={{ color: t.muted, fontSize: 13, lineHeight: 20 }}>
        如果營養師或課程有給你每天的份數（例如減脂時澱粉只吃 4 份），可以填在這裡，上面的格子就會改成依照你的計畫判斷。
      </Text>

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
            <Stepper value={p[g.id] ?? 0} step={0.5} label={g.short} onChange={(v) => setP({ ...p, [g.id]: v })} />
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

      <View style={[styles.btns]}>
        {hasPlan && <Button label="改回國健署建議" ghost onPress={onReset} />}
        <Button label="取消" ghost onPress={onClose} />
        <Button label="儲存" onPress={() => onSave(p)} disabled={kcal === 0} />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
});
