// GET /api/typhoon：目前的颱風（熱帶氣旋）位置、強度與預測路徑
import { arr, endpoint, g, num } from '../../server/cwa';
import type { Cyclone, TrackPoint } from '../../src/lib/cwa';

function point(f: any, forecast: boolean): TrackPoint | null {
  // 座標格式為「經度,緯度」，保險起見也處理分開的欄位
  const c = String(g(f, 'coordinate') ?? '').split(',').map(Number);
  let lon = c.length === 2 ? c[0] : Number(g(f, 'longitude'));
  let lat = c.length === 2 ? c[1] : Number(g(f, 'latitude'));
  if (lon < lat) [lon, lat] = [lat, lon]; // 台灣附近經度一定大於緯度
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return {
    time: String(g(f, forecast ? 'initTime' : 'fixTime') ?? ''),
    lon,
    lat,
    wind: num(g(f, 'maxWindSpeed')),
    gust: num(g(f, 'maxGustSpeed')),
    pressure: num(g(f, 'pressure')),
    speed: num(g(f, 'movingSpeed')),
    dir: String(g(f, 'movingDirection') ?? ''),
    radius: num(forecast ? g(f, 'radiusOf70PercentProbability') : g(f, 'circleOf15Ms.radius')),
    tau: forecast ? num(g(f, 'tau')) : null,
  };
}

const DIRS: Record<string, string> = {
  N: '北', NNE: '北北東', NE: '東北', ENE: '東北東', E: '東', ESE: '東南東', SE: '東南', SSE: '南南東',
  S: '南', SSW: '南南西', SW: '西南', WSW: '西南西', W: '西', WNW: '西北西', NW: '西北', NNW: '北北西',
};

export const onRequestGet = endpoint(600, [{ dataset: 'W-C0034-005' }], ([records]) => {
  const cyclones: Cyclone[] = arr(g(records, 'tropicalCyclones.tropicalCyclone')).map((c) => {
    const name = String(g(c, 'cwaTyphoonName') ?? '');
    const en = String(g(c, 'typhoonName') ?? '');
    const td = String(g(c, 'cwaTdNo') ?? '');
    const fix = (p: TrackPoint | null) => (p ? { ...p, dir: DIRS[p.dir] ?? p.dir } : null);
    return {
      name,
      en,
      label: name ? `${name}颱風` : en ? `${en} 颱風` : `熱帶性低氣壓 TD${td}`,
      past: arr(g(c, 'analysisData.fix')).map((f) => fix(point(f, false))).filter((p): p is TrackPoint => !!p),
      forecast: arr(g(c, 'forecastData.fix')).map((f) => fix(point(f, true))).filter((p): p is TrackPoint => !!p),
    };
  });
  return { cyclones: cyclones.filter((c) => c.past.length) };
});
