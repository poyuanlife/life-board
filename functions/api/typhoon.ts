// GET /api/typhoon：目前的颱風（熱帶氣旋）位置、強度與預測路徑
import { arr, endpoint, g, num } from '../../server/cwa';
import type { Cyclone, TrackPoint } from '../../src/lib/cwa';

/** 依序試幾個欄位名稱，回傳第一個有值的 */
const first = (o: any, ...paths: string[]) => paths.map((p) => g(o, p)).find((v) => v != null && v !== '');

const DIRS: Record<string, string> = {
  N: '北', NNE: '北北東', NE: '東北', ENE: '東北東', E: '東', ESE: '東南東', SE: '東南', SSE: '南南東',
  S: '南', SSW: '南南西', SW: '西南', WSW: '西南西', W: '西', WNW: '西北西', NW: '西北', NNW: '北北西',
};

/** 2026-10-22T14:00:00+08:00 加 n 小時，維持台灣時間格式 */
function addHours(iso: string, h: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t + (h + 8) * 3600000).toISOString().slice(0, 19) + '+08:00';
}

function point(f: any, forecast: boolean): TrackPoint | null {
  let lon = num(first(f, 'CoordinateLongitude', 'longitude'));
  let lat = num(first(f, 'CoordinateLatitude', 'latitude'));
  // 舊格式：coordinate = "經度,緯度"
  const c = String(g(f, 'coordinate') ?? '').split(',').map(Number);
  if ((lon == null || lat == null) && c.length === 2) [lon, lat] = c;
  if (lon == null || lat == null || !Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < lat) [lon, lat] = [lat, lon]; // 西北太平洋經度一定大於緯度

  const tau = forecast ? num(first(f, 'ForecastHour', 'tau')) : null;
  const base = String(first(f, forecast ? 'InitialTime' : 'DateTime', forecast ? 'initTime' : 'fixTime') ?? '');
  const prediction = arr(g(f, 'MovingPrediction')).find((p) => g(p, 'lang') === 'zh-hant');
  const dir = String(g(f, 'MovingDirection') ?? '');
  return {
    time: tau != null ? addHours(base, tau) : base,
    lon,
    lat,
    wind: num(g(f, 'MaxWindSpeed')),
    gust: num(g(f, 'MaxGustSpeed')),
    pressure: num(g(f, 'Pressure')),
    speed: num(g(f, 'MovingSpeed')),
    dir: DIRS[dir] ?? dir,
    radius: forecast
      ? num(first(f, 'Radius70PercentProbability', 'radiusOf70PercentProbability'))
      : num(first(f, 'Circle15ms.Radius', 'circleOf15Ms.radius')),
    radius25: num(first(f, 'Circle25ms.Radius', 'circleOf25Ms.radius')),
    prediction: prediction ? String(g(prediction, 'value') ?? '') : '',
    tau,
  };
}

/** 氣象署強度分級（近中心最大風速 m/s） */
function grade(wind: number | null) {
  if (wind == null) return '颱風';
  if (wind >= 51) return '強烈颱風';
  if (wind >= 32.7) return '中度颱風';
  if (wind >= 17.2) return '輕度颱風';
  return '熱帶性低氣壓';
}

export const onRequestGet = endpoint(1800, [{ dataset: 'W-C0034-005' }], ([records]) => {
  const cyclones: Cyclone[] = arr(g(records, 'TropicalCyclones.TropicalCyclone')).map((c) => {
    const name = String(g(c, 'CwaTyphoonName') ?? '');
    const en = String(g(c, 'TyphoonName') ?? '');
    const td = String(g(c, 'CwaTdNo') ?? '');
    const past = arr(g(c, 'AnalysisData.Fix')).map((f) => point(f, false)).filter((p): p is TrackPoint => !!p);
    const forecast = arr(g(c, 'ForecastData.Fix')).map((f) => point(f, true)).filter((p): p is TrackPoint => !!p);
    const level = grade(past[past.length - 1]?.wind ?? null);
    return {
      name,
      en,
      label: level === '熱帶性低氣壓' ? `熱帶性低氣壓 TD${td}` : `${level} ${name || en}`,
      past,
      forecast,
    };
  });
  return { cyclones: cyclones.filter((c) => c.past.length) };
});
