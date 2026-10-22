// GET /api/weather：各縣市 36 小時天氣預報 + 目前氣溫（中央氣象署）
import { arr, endpoint, g, num } from '../../server/cwa';
import type { CountyWeather, Period } from '../../src/lib/cwa';

// 縣市顯示順序（北到南、離島最後）
const ORDER = [
  '臺北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣',
  '嘉義市', '嘉義縣', '臺南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣',
];

// 各縣市優先採用的代表測站（其他縣市自動挑海拔最低的測站，避免拿到高山的溫度）
const PREFERRED: Record<string, string> = {
  臺北市: '臺北', 新北市: '板橋', 基隆市: '基隆', 桃園市: '新屋', 新竹市: '新竹', 臺中市: '臺中', 嘉義市: '嘉義',
  臺南市: '臺南', 高雄市: '高雄', 宜蘭縣: '宜蘭', 花蓮縣: '花蓮', 臺東縣: '臺東', 澎湖縣: '澎湖', 金門縣: '金門', 連江縣: '馬祖',
};

function forecast(records: any): Map<string, Period[]> {
  const out = new Map<string, Period[]>();
  for (const loc of arr(g(records, 'location'))) {
    const els = new Map<string, any[]>(arr(g(loc, 'weatherElement')).map((e) => [g(e, 'elementName'), arr(g(e, 'time'))]));
    const base = els.get('Wx') ?? [];
    const at = (name: string, i: number) => g(els.get(name)?.[i], 'parameter.parameterName');
    out.set(
      g(loc, 'locationName'),
      base.map((t, i) => ({
        start: g(t, 'startTime') ?? '',
        end: g(t, 'endTime') ?? '',
        wx: at('Wx', i) ?? '',
        pop: num(at('PoP', i)),
        min: num(at('MinT', i)),
        max: num(at('MaxT', i)),
        ci: at('CI', i) ?? '',
      }))
    );
  }
  return out;
}

function observations(records: any): Map<string, CountyWeather['now']> {
  const byCounty = new Map<string, any[]>();
  for (const s of arr(g(records, 'Station'))) {
    const county = g(s, 'GeoInfo.CountyName');
    if (!county || num(g(s, 'WeatherElement.AirTemperature')) == null) continue;
    byCounty.set(county, [...(byCounty.get(county) ?? []), s]);
  }
  const out = new Map<string, CountyWeather['now']>();
  for (const [county, list] of byCounty) {
    const s =
      list.find((x) => g(x, 'StationName') === PREFERRED[county]) ??
      [...list].sort((a, b) => (num(g(a, 'GeoInfo.StationAltitude')) ?? 0) - (num(g(b, 'GeoInfo.StationAltitude')) ?? 0))[0];
    const w = g(s, 'WeatherElement');
    const weather = String(g(w, 'Weather') ?? '');
    out.set(county, {
      temp: num(g(w, 'AirTemperature'))!,
      humidity: num(g(w, 'RelativeHumidity')),
      weather: weather === '-99' ? '' : weather,
      high: num(g(w, 'DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature')),
      low: num(g(w, 'DailyExtreme.DailyLow.TemperatureInfo.AirTemperature')),
      station: g(s, 'StationName') ?? '',
      time: String(g(s, 'ObsTime.DateTime') ?? ''),
    });
  }
  return out;
}

export const onRequestGet = endpoint(600, [{ dataset: 'F-C0032-001' }, { dataset: 'O-A0003-001' }], ([fc, obs]) => {
  const periods = forecast(fc);
  const now = observations(obs);
  const names = [...ORDER.filter((n) => periods.has(n)), ...[...periods.keys()].filter((n) => !ORDER.includes(n))];
  const counties: CountyWeather[] = names.map((name) => ({ name, now: now.get(name) ?? null, periods: periods.get(name) ?? [] }));
  return { counties };
});
