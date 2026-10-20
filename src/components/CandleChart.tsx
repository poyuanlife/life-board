import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { Candle } from '@/lib/series';
import { useTheme } from '@/lib/theme';

type Props = { candles: Candle[]; height?: number; digits?: number };

const fmtWeek = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
};

// 週 K 線：紅 = 本週收盤比上週高，綠 = 比上週低，灰 = 持平
export function CandleChart({ candles, height = 96, digits = 1 }: Props) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const axisW = 40; // 右側價格刻度
  const plotW = Math.max(0, width - axisW);
  const pad = 6;
  const hi = Math.max(...candles.map((c) => c.high));
  const lo = Math.min(...candles.map((c) => c.low));
  const span = hi - lo || hi * 0.02 || 1;
  const y = (v: number) => pad + ((hi - v) / span) * (height - pad * 2);
  const slot = candles.length ? plotW / candles.length : 0;
  const bodyW = Math.min(14, Math.max(4, slot * 0.5));

  const shown = active ?? candles.length - 1;
  const c = candles[shown];
  const color = (k: Candle) => (k.close > k.open ? t.up : k.close < k.open ? t.down : t.faint);

  return (
    <View>
      <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {/* 最高、最低兩條淡格線 */}
            {[hi, lo].map((v, i) => (
              <Line key={i} x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke={t.grid} strokeWidth={1} />
            ))}
            <SvgText x={width - 2} y={y(hi) + 4} fontSize={10} fill={t.faint} textAnchor="end">
              {hi.toFixed(digits)}
            </SvgText>
            <SvgText x={width - 2} y={y(lo) + 4} fontSize={10} fill={t.faint} textAnchor="end">
              {lo.toFixed(digits)}
            </SvgText>

            {candles.map((k, i) => {
              const cx = slot * i + slot / 2;
              const top = y(Math.max(k.open, k.close));
              const h = Math.max(2, Math.abs(y(k.open) - y(k.close)));
              const col = color(k);
              const dim = active != null && active !== i;
              return (
                <G key={k.week} opacity={dim ? 0.35 : 1}>
                  <Line x1={cx} x2={cx} y1={y(k.high)} y2={y(k.low)} stroke={col} strokeWidth={1.5} />
                  <Rect x={cx - bodyW / 2} y={top} width={bodyW} height={h} rx={2} fill={col} />
                </G>
              );
            })}
          </Svg>
        )}

        {/* 透明的點擊/滑過區域，比 K 棒本身寬，手機好點 */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', right: axisW }]}>
          {candles.map((k, i) => (
            <Pressable
              key={k.week}
              style={{ flex: 1 }}
              onPressIn={() => setActive(i)}
              onHoverIn={() => setActive(i)}
              onHoverOut={() => setActive(null)}
              accessibilityLabel={`${fmtWeek(k.week)} 當週收盤 ${k.close}`}
            />
          ))}
        </View>
      </View>

      <View style={styles.xAxis}>
        <Text style={[styles.axisText, { color: t.faint }]}>{candles[0] ? `${fmtWeek(candles[0].week)} 當週` : ''}</Text>
        <Text style={[styles.axisText, { color: t.faint, marginRight: axisW }]}>本週</Text>
      </View>

      {/* 選取的那一週的明細（預設顯示本週） */}
      {c && (
        <View style={[styles.detail, { backgroundColor: t.iconBg }]}>
          <Text style={[styles.detailText, { color: t.text, fontWeight: '600' }]}>
            {shown === candles.length - 1 ? '本週' : `${fmtWeek(c.week)} 當週`}
          </Text>
          <Text style={[styles.detailText, { color: t.muted }]}>
            開 {c.open.toFixed(digits)}・高 {c.high.toFixed(digits)}・低 {c.low.toFixed(digits)}・收{' '}
            <Text style={{ color: t.text, fontWeight: '600' }}>{c.close.toFixed(digits)}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  detailText: { fontSize: 12, fontVariant: ['tabular-nums'] },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisText: { fontSize: 10 },
});
