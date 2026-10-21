import { StyleSheet, Text, View } from 'react-native';
import { fmtNum, GROUPS, MORE_EXAMPLES, PRESETS } from '@/lib/exchange';
import { useTheme } from '@/lib/theme';

const MACROS = [
  { key: 'p', label: '蛋白質' },
  { key: 'c', label: '碳水' },
  { key: 'f', label: '脂肪' },
] as const;

const SAMPLE = PRESETS.find((x) => x.id === 'bento')!;

/** 「1 份是多少」與營養素怎麼算：記錄表單裡展開用，頁面下方也用同一份 */
export function PortionGuide() {
  const t = useTheme();
  const used = GROUPS.filter((g) => (SAMPLE.p[g.id] ?? 0) > 0);

  return (
    <View style={{ gap: 14 }}>
      {/* 怎麼算 */}
      <View style={[styles.box, { backgroundColor: t.iconBg }]}>
        <Text style={{ color: t.text, fontWeight: '700' }}>蛋白質、碳水、脂肪怎麼算？</Text>
        <Text style={[styles.p, { color: t.text }]}>
          同一類食物，每 1 份的營養素都差不多（見下方「每份」）。把「份數 × 每份含量」加起來就是總量。
        </Text>
        <Text style={[styles.p, { color: t.muted }]}>
          例：{SAMPLE.name}＝{used.map((g) => `${g.short} ${fmtNum(SAMPLE.p[g.id]!)} 份`).join('、')}
        </Text>
        {MACROS.map((m) => {
          const terms = used.filter((g) => g[m.key] > 0);
          const sum = terms.reduce((s, g) => s + g[m.key] * SAMPLE.p[g.id]!, 0);
          return (
            <Text key={m.key} style={[styles.formula, { color: t.text }]}>
              {m.label}＝{terms.length ? terms.map((g) => `${fmtNum(SAMPLE.p[g.id]!)}×${g[m.key]}`).join('＋') : '0'}＝
              <Text style={{ fontWeight: '700' }}>{fmtNum(Math.round(sum * 10) / 10)} 公克</Text>
            </Text>
          );
        })}
        <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
          熱量：蛋白質和碳水每公克 4 大卡、脂肪每公克 9 大卡。
        </Text>
      </View>

      {/* 各類的例子 */}
      {GROUPS.map((g) => (
        <View key={g.id} style={{ gap: 6 }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
            {g.icon} {g.name}
          </Text>
          <Text style={{ color: t.muted, fontSize: 12 }}>
            每份：{g.kcal} 大卡・蛋白質 {g.p}g・碳水 {g.c}g・脂肪 {g.f}g
          </Text>
          <View style={styles.tags}>
            {MORE_EXAMPLES[g.id].map((ex) => (
              <Text key={ex} style={[styles.tag, { color: t.text, backgroundColor: t.chip }]}>
                {ex}
              </Text>
            ))}
          </View>
        </View>
      ))}
      <Text style={{ color: t.faint, fontSize: 12, lineHeight: 18 }}>
        ※ 依衛福部「食物代換表」換算，份量為大約值。豆魚蛋肉類以中脂計算，雞胸肉、魚肉脂肪較少，五花肉、香腸較多；乳品以全脂計算；炒菜、炸物通常會多 1～2 份油脂。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, padding: 12, gap: 6 },
  p: { fontSize: 14, lineHeight: 22 },
  formula: { fontSize: 14, lineHeight: 22, fontVariant: ['tabular-nums'] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { fontSize: 13, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
});
