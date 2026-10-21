import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayTotals, hasRecord, shiftDate, type Log } from '@/lib/diary';
import { useTheme } from '@/lib/theme';
import { kcalText, Panel } from './ui';

const H = 140;
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/** 最近 7 天的淨攝取熱量（吃進 − 運動），點長條可以切到那一天 */
export function WeekChart({ log, end, target, onPick }: { log: Log; end: string; target: number | null; onPick: (d: string) => void }) {
  const t = useTheme();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(end, i - 6);
    const day = log.days[date];
    return { date, has: hasRecord(day), net: day ? dayTotals(day).net : 0 };
  });
  const recorded = days.filter((d) => d.has);
  const avg = recorded.length ? recorded.reduce((s, d) => s + d.net, 0) / recorded.length : null;
  const max = Math.max(target ?? 0, ...days.map((d) => d.net), 1) * 1.1;

  return (
    <Panel
      title="📊 最近 7 天"
      right={
        <Text style={{ color: t.muted, fontSize: 13 }}>
          {avg != null ? `有記錄的 ${recorded.length} 天平均 ${kcalText(avg)} 大卡` : '還沒有紀錄'}
        </Text>
      }>
      <View style={[styles.plot, { height: H }]}>
        {target != null && (
          <View style={[styles.target, { bottom: (target / max) * H, borderColor: t.accent }]}>
            <Text style={[styles.targetLabel, { color: t.accent, backgroundColor: t.card }]}>目標 {kcalText(target)}</Text>
          </View>
        )}
        {days.map((d) => {
          const over = target != null && d.net > target;
          const h = d.has ? Math.max(2, (Math.max(0, d.net) / max) * H) : 0;
          return (
            <Pressable key={d.date} onPress={() => onPick(d.date)} style={styles.col} accessibilityLabel={`${d.date} ${d.has ? kcalText(d.net) + ' 大卡' : '沒有紀錄'}`}>
              {d.has && <Text style={[styles.val, { color: t.muted }]}>{kcalText(d.net)}</Text>}
              <View
                style={{
                  height: h,
                  width: '70%',
                  maxWidth: 40,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  backgroundColor: over ? t.up : t.down,
                  opacity: d.date === end ? 1 : 0.6,
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.axis, { borderColor: t.border }]}>
        {days.map((d) => {
          const [y, m, dd] = d.date.split('-').map(Number);
          const on = d.date === end;
          return (
            <Text key={d.date} style={[styles.tick, { color: on ? t.text : t.faint, fontWeight: on ? '700' : '400' }]}>
              {m}/{dd}
              {'\n'}
              {WEEK[new Date(y, m - 1, dd).getDay()]}
            </Text>
          );
        })}
      </View>
      <Text style={{ color: t.faint, fontSize: 12 }}>長條是「吃進 − 運動」的淨熱量；綠色在目標內、紅色超過目標。點長條可以看那一天。</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', position: 'relative', marginTop: 16 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  val: { fontSize: 11, marginBottom: 2, fontVariant: ['tabular-nums'] },
  target: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', zIndex: 1, pointerEvents: 'none' },
  targetLabel: { position: 'absolute', left: 0, top: -16, fontSize: 11, paddingHorizontal: 4 },
  axis: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 4 },
  tick: { flex: 1, textAlign: 'center', fontSize: 11, lineHeight: 15 },
});
