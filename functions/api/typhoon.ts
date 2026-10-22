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

// 氣象署官網「颱風消息」頁用的資料檔，裡面有最新路徑潛勢圖的發布時間（檔名會用到）
async function officialImage(): Promise<{ image: string | null; imageTime: string }> {
  try {
    const js = await (await fetch('https://www.cwa.gov.tw/Data/js/typhoon/TY_NEWS-Data.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const stamp = js.match(/TY_DataTime\s*=\s*'(\d{12})'/)?.[1];
    const path = js.match(/DataPath\s*=\s*'([\w/]+)'/)?.[1] ?? 'typhoon/TY_NEWS/';
    const time = js.match(/TY_TIME\s*=\s*\{'C':'([^']+)'/)?.[1] ?? '';
    if (!stamp) return { image: null, imageTime: '' };
    const image = `https://www.cwa.gov.tw/Data/${path}Download_PTA_${stamp}_zhtw.png`;
    // 確認圖片真的存在
    const head = await fetch(image, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    return head.ok ? { image, imageTime: time } : { image: null, imageTime: '' };
  } catch {
    return { image: null, imageTime: '' };
  }
}

export const onRequestGet = endpoint(1800, [{ dataset: 'W-C0034-005' }], async ([records]) => {
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
  const list = cyclones.filter((c) => c.past.length);
  // 有颱風才去找官方路徑圖
  return { cyclones: list, ...(list.length ? await officialImage() : { image: null, imageTime: '' }) };
});
