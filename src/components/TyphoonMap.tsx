import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';
import type { Cyclone } from '@/lib/cwa';
import { useTheme } from '@/lib/theme';

// 簡化的台灣本島輪廓（經度, 緯度），只用來看颱風相對位置
const TAIWAN = [
  [121.51, 25.3], [121.9, 25.12], [122.0, 25.0], [121.84, 24.6], [121.82, 24.35], [121.62, 24.0], [121.5, 23.5],
  [121.35, 23.05], [121.15, 22.75], [120.9, 22.35], [120.85, 21.9], [120.72, 21.95], [120.62, 22.3], [120.42, 22.48],
  [120.27, 22.6], [120.15, 22.95], [120.08, 23.2], [120.15, 23.7], [120.3, 24.0], [120.48, 24.25], [120.7, 24.6],
  [120.92, 24.85], [121.05, 25.05], [121.25, 25.12], [121.4, 25.25],
];

const W = 400;
const H = 320;

// 只畫最近 3 天的路徑，不然颱風從很遠的地方生成時，台灣會被縮得很小
function recent(c: Cyclone): Cyclone {
  const last = Date.parse(c.past[c.past.length - 1]?.time ?? '');
  if (!Number.isFinite(last)) return c;
  return { ...c, past: c.past.filter((p) => !(last - Date.parse(p.time) > 72 * 3600000)) };
}

export function TyphoonMap({ cyclones: all }: { cyclones: Cyclone[] }) {
  const cyclones = all.map(recent);
  const t = useTheme();
  const [w, setW] = useState(0);
  // 畫面範圍：預設台灣周邊，颱風跑出去就把範圍放大
  let [lon0, lon1, lat0, lat1] = [113, 133, 14, 30];
  for (const c of cyclones)
    for (const p of [...c.past, ...c.forecast]) {
      lon0 = Math.min(lon0, p.lon - 2);
      lon1 = Math.max(lon1, p.lon + 2);
      lat0 = Math.min(lat0, p.lat - 2);
      lat1 = Math.max(lat1, p.lat + 2);
    }
  // 保持比例，避免地圖被壓扁
  const scale = Math.min(W / (lon1 - lon0), H / (lat1 - lat0));
  const cx = (lon0 + lon1) / 2;
  const cy = (lat0 + lat1) / 2;
  const x = (lon: number) => W / 2 + (lon - cx) * scale;
  const y = (lat: number) => H / 2 - (lat - cy) * scale;
  const pts = (list: { lon: number; lat: number }[]) => list.map((p) => `${x(p.lon)},${y(p.lat)}`).join(' ');

  const grid: number[] = [];
  for (let d = Math.ceil((cx - W / 2 / scale) / 5) * 5; d <= cx + W / 2 / scale; d += 5) grid.push(d);
  const gridLat: number[] = [];
  for (let d = Math.ceil((cy - H / 2 / scale) / 5) * 5; d <= cy + H / 2 / scale; d += 5) gridLat.push(d);

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ width: '100%' }}>
      {w > 0 && (
    <Svg width={w} height={(w * H) / W} viewBox={`0 0 ${W} ${H}`}>
      {grid.map((d) => (
        <Line key={`x${d}`} x1={x(d)} x2={x(d)} y1={0} y2={H} stroke={t.grid} strokeWidth={1} />
      ))}
      {gridLat.map((d) => (
        <Line key={`y${d}`} x1={0} x2={W} y1={y(d)} y2={y(d)} stroke={t.grid} strokeWidth={1} />
      ))}
      {grid.map((d) => (
        <SvgText key={`lx${d}`} x={x(d) + 3} y={H - 4} fontSize={10} fill={t.faint}>{`${d}°E`}</SvgText>
      ))}
      {gridLat.map((d) => (
        <SvgText key={`ly${d}`} x={3} y={y(d) - 3} fontSize={10} fill={t.faint}>{`${d}°N`}</SvgText>
      ))}

      <Polygon points={pts(TAIWAN.map(([lon, lat]) => ({ lon, lat })))} fill={t.muted} opacity={0.6} />

      {cyclones.map((c) => {
        const last = c.past[c.past.length - 1];
        return (
          <G key={c.label}>
            {/* 預測：70% 機率範圍圓圈 + 虛線路徑 */}
            {c.forecast.map((p, i) =>
              p.radius ? (
                <Circle key={`r${c.label}${i}`} cx={x(p.lon)} cy={y(p.lat)} r={(p.radius / 111) * scale} fill={t.flat} opacity={0.12} stroke={t.flat} strokeOpacity={0.5} />
              ) : null
            )}
            <Polyline points={pts([last, ...c.forecast])} fill="none" stroke={t.flat} strokeWidth={2} strokeDasharray="5,4" />
            {/* 過去路徑 */}
            <Polyline points={pts(c.past)} fill="none" stroke={t.up} strokeWidth={2.5} />
            {c.past.map((p, i) => (
              <Circle key={`p${c.label}${i}`} cx={x(p.lon)} cy={y(p.lat)} r={2.5} fill={t.up} />
            ))}
            {/* 現在位置：七級風暴風圈 */}
            {last.radius ? <Circle cx={x(last.lon)} cy={y(last.lat)} r={(last.radius / 111) * scale} fill={t.up} opacity={0.15} /> : null}
            <Circle cx={x(last.lon)} cy={y(last.lat)} r={6} fill={t.up} stroke="#fff" strokeWidth={2} />
            <SvgText x={x(last.lon) + 9} y={y(last.lat) + 4} fontSize={12} fontWeight="bold" fill={t.text}>
              {c.name || c.en || c.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
      )}
    </View>
  );
}
