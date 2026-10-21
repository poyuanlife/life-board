import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { newId, type ExerciseEntry } from '@/lib/diary';
import { EXERCISES, exerciseKcal } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';
import { Button, Chip, Input, kcalText, Panel } from './ui';

const DEFAULT_WEIGHT = 60;

export function ExerciseLog(props: { list: ExerciseEntry[]; weight: number | null; onChange: (list: ExerciseEntry[]) => void }) {
  const { list, weight, onChange } = props;
  const t = useTheme();
  const [kind, setKind] = useState<string | null>(null); // null = 自己輸入熱量
  const [minutes, setMinutes] = useState('30');
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  const w = weight ?? DEFAULT_WEIGHT;
  const preset = EXERCISES.find((e) => e.name === kind);
  const min = Math.min(600, Number(minutes) || 0);
  const est = preset ? exerciseKcal(preset.met, w, min) : Math.min(5000, Number(kcal) || 0);
  const total = list.reduce((s, e) => s + e.kcal, 0);

  const add = () => {
    if (est <= 0) return;
    const label = preset ? preset.name : name.trim() || '運動';
    onChange([...list, { id: newId(), name: label, minutes: preset ? min : 0, kcal: est }]);
    setName('');
    setKcal('');
  };

  return (
    <Panel title="🏃 運動紀錄" right={<Text style={{ color: t.muted }}>共消耗 {kcalText(total)} 大卡</Text>}>
      {list.length > 0 && (
        <View style={{ gap: 4 }}>
          {list.map((e) => (
            <View key={e.id} style={styles.item}>
              <Text style={{ color: t.text, flex: 1 }}>
                {e.name}
                {e.minutes ? <Text style={{ color: t.faint }}>　{e.minutes} 分鐘</Text> : null}
              </Text>
              <Text style={{ color: t.text, fontWeight: '600' }}>−{kcalText(e.kcal)} 大卡</Text>
              <Remove onPress={() => onChange(list.filter((x) => x.id !== e.id))} label={e.name} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.row}>
        {EXERCISES.map((e) => (
          <Chip key={e.name} label={e.name} on={kind === e.name} onPress={() => setKind(e.name)} />
        ))}
        <Chip label="自己輸入熱量" on={kind === null} onPress={() => setKind(null)} />
      </View>

      <View style={[styles.row, { alignItems: 'center' }]}>
        {preset ? (
          <>
            <Input
              value={minutes}
              onChangeText={(v) => setMinutes(v.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              keyboardType="number-pad"
              accessibilityLabel="運動分鐘數"
              style={{ width: 80 }}
            />
            <Text style={{ color: t.muted }}>分鐘，約消耗 {kcalText(est)} 大卡</Text>
          </>
        ) : (
          <>
            <Input flex={2} value={name} onChangeText={setName} placeholder="運動名稱" accessibilityLabel="運動名稱" style={{ minWidth: 120 }} />
            <Input
              flex={1}
              value={kcal}
              onChangeText={(v) => setKcal(v.replace(/[^0-9]/g, ''))}
              placeholder="消耗大卡"
              inputMode="numeric"
              keyboardType="number-pad"
              accessibilityLabel="消耗熱量"
              style={{ minWidth: 100 }}
            />
          </>
        )}
        <Button label="加入" onPress={add} disabled={est <= 0} />
      </View>
      <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
        {weight ? `依你的體重 ${weight} 公斤估算。` : `還沒填體重，先用 ${DEFAULT_WEIGHT} 公斤估算。`}
        有記錄運動的話，上方活動量建議選「久坐」，才不會重複計算。
      </Text>
    </Panel>
  );
}

const CUP = 250;

export function WaterLog({ ml, weight, onChange }: { ml: number; weight: number | null; onChange: (ml: number) => void }) {
  const t = useTheme();
  const target = weight ? Math.round((weight * 30) / 50) * 50 : 2000;
  const cups = Math.ceil(target / CUP);
  const done = Math.floor(ml / CUP);

  return (
    <Panel title="💧 喝水紀錄" right={<Text style={{ color: t.muted }}>{ml.toLocaleString('en-US')} / {target.toLocaleString('en-US')} 毫升</Text>}>
      <View style={styles.cups}>
        {Array.from({ length: Math.max(cups, done) }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => onChange((i < done ? i : i + 1) * CUP)}
            accessibilityLabel={`喝了 ${i + 1} 杯`}
            style={[styles.cup, { borderColor: i < done ? t.accent : t.border, backgroundColor: i < done ? t.accent : t.bg }]}>
            <Text style={{ fontSize: 16, opacity: i < done ? 1 : 0.35 }}>💧</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.row, { alignItems: 'center' }]}>
        <Button label="− 1 杯" ghost onPress={() => onChange(Math.max(0, ml - CUP))} disabled={ml === 0} />
        <Button label="+ 1 杯（250 毫升）" onPress={() => onChange(ml + CUP)} />
      </View>
      <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
        {weight ? `建議每天約喝體重 × 30 毫升（${target} 毫升）。` : '填好體重後會依體重 × 30 毫升計算建議量，目前先以 2000 毫升顯示。'}
        運動、流汗多時要再多喝一些；有腎臟或心臟疾病的人請依醫師建議。
      </Text>
    </Panel>
  );
}

export function Remove({ onPress, label }: { onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.remove} accessibilityLabel={`刪除${label}`}>
      <Text style={{ color: t.faint, fontSize: 14 }}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cups: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cup: { width: 36, height: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  remove: { paddingHorizontal: 8, paddingVertical: 4 },
});
