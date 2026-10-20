import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { trendOf, type PriceItem } from '@/lib/series';
import { TREND_LABEL, useTheme } from '@/lib/theme';

const RANGE = 15; // 量表左右兩端代表 -15% / +15%
const FLAT = 2; // ±2% 內算持平（黃區）

// 半圓上的點：v 從 -RANGE 到 +RANGE，對應左到右
function point(v: number, r: number, cx: number, cy: number) {
  const clamped = Math.max(-RANGE, Math.min(RANGE, v));
  const angle = Math.PI * (1 - (clamped + RANGE) / (2 * RANGE)); // π → 0
  return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
}

function arc(from: number, to: number, r: number, cx: number, cy: number) {
  const [x1, y1] = point(from, r, cx, cy);
  const [x2, y2] = point(to, r, cx, cy);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

// 物價溫度計：綜合油價、菜價、肉蛋本週平均漲跌
export function PriceGauge({ items }: { items: PriceItem[] }) {
  const t = useTheme();
  const goods = items.filter((i) => i.category !== 'fx' && i.changePct != null);
  const avg = goods.length ? goods.reduce((s, i) => s + (i.changePct ?? 0), 0) / goods.length : 0;
  const overall = trendOf(avg, FLAT);

  const counts = { up: 0, flat: 0, down: 0 };
  for (const i of goods) counts[trendOf(i.changePct, i.threshold)]++;

  const sorted = [...goods].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const topUp = sorted.filter((i) => trendOf(i.changePct, i.threshold) === 'up').slice(0, 3);
  const topDown = sorted.filter((i) => trendOf(i.changePct, i.threshold) === 'down').reverse().slice(0, 3);

  const W = 240;
  const H = 136;
  const cx = W / 2;
  const cy = 120;
  const r = 100;
  const [nx, ny] = point(avg, r - 22, cx, cy);
  const gap = 0.6; // 色帶之間的小空隙

  const headline = { up: '物價上漲中', flat: '物價大致持平', down: '物價下跌中' }[overall];

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={styles.gaugeCol}>
        <Text style={[styles.title, { color: t.text }]}>🌡️ 本週物價溫度計</Text>
        <Svg width={W} height={H}>
          <Path d={arc(-RANGE, -FLAT - gap, r, cx, cy)} stroke={t.down} strokeWidth={18} fill="none" />
          <Path d={arc(-FLAT + gap, FLAT - gap, r, cx, cy)} stroke={t.flat} strokeWidth={18} fill="none" />
          <Path d={arc(FLAT + gap, RANGE, r, cx, cy)} stroke={t.up} strokeWidth={18} fill="none" />
          <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={t.text} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r={6} fill={t.text} />
        </Svg>
        <View style={[styles.scale, { width: W }]}>
          <Text style={{ color: t.muted, fontSize: 12 }}>▼ 跌</Text>
          <Text style={{ color: t.muted, fontSize: 12 }}>漲 ▲</Text>
        </View>
        <Text style={[styles.big, { color: t.text }]}>
          {avg > 0 ? '+' : ''}
          {avg.toFixed(1)}%
        </Text>
        <View style={styles.headlineRow}>
          <View style={[styles.dot, { backgroundColor: t[overall] }]} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{headline}</Text>
        </View>
        <Text style={{ color: t.faint, fontSize: 11, marginTop: 4 }}>{goods.length} 項民生物資與上週相比的平均漲跌</Text>
      </View>

      <View style={styles.summaryCol}>
        <View style={styles.counts}>
          {(['up', 'flat', 'down'] as const).map((k) => (
            <View key={k} style={[styles.countBox, { backgroundColor: t.iconBg }]}>
              <View style={[styles.dot, { backgroundColor: t[k] }]} />
              <Text style={[styles.countNum, { color: t.text }]}>{counts[k]}</Text>
              <Text style={{ color: t.muted, fontSize: 12 }}>
                {TREND_LABEL[k].icon} {TREND_LABEL[k].label}
              </Text>
            </View>
          ))}
        </View>
        <Mover title="漲最多" list={topUp} />
        <Mover title="跌最多" list={topDown} />
      </View>
    </View>
  );
}

function Mover({ title, list }: { title: string; list: PriceItem[] }) {
  const t = useTheme();
  if (!list.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: t.muted, fontSize: 12 }}>{title}</Text>
      {list.map((i) => (
        <View key={i.id} style={styles.moverRow}>
          <Text style={{ fontSize: 18 }}>{i.icon}</Text>
          <Text style={{ color: t.text, flex: 1 }}>{i.name}</Text>
          <Text style={{ color: t.text, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
            {(i.changePct ?? 0) > 0 ? '▲ +' : '▼ '}
            {i.changePct?.toFixed(1)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  gaugeCol: { alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8, alignSelf: 'flex-start' },
  scale: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: -6 },
  big: { fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 4 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  summaryCol: { flexGrow: 1, flexBasis: 260, maxWidth: 420, gap: 14, justifyContent: 'center' },
  counts: { flexDirection: 'row', gap: 8 },
  countBox: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  countNum: { fontSize: 24, fontWeight: '800' },
  moverRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
