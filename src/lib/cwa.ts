// 天氣地震頁的資料格式（由 Cloudflare 上的 /api/* 整理好再給網頁）
// 資料來源：中央氣象署開放資料平臺

export type Period = {
  start: string; // 2026-10-22 18:00:00（台灣時間）
  end: string;
  wx: string; // 天氣現象，例如「多雲時晴」
  pop: number | null; // 降雨機率 %
  min: number | null;
  max: number | null;
  ci: string; // 舒適度，例如「舒適」
};

export type CountyWeather = {
  name: string; // 臺北市
  now: {
    temp: number;
    humidity: number | null;
    weather: string;
    high: number | null;
    low: number | null;
    station: string;
    time: string;
  } | null;
  periods: Period[];
};

export type WeatherResponse = { counties: CountyWeather[]; updatedAt: string; error?: string };

export type Quake = {
  no: string;
  big: boolean; // true = 顯著有感地震（有編號），false = 小區域有感地震
  time: string; // 2026-10-22 08:12:33
  location: string;
  depth: number | null; // 公里
  mag: number | null;
  maxIntensity: string; // 例如「4級」「5弱」
  areas: { county: string; intensity: string }[];
  web: string;
  image: string;
};

export type QuakeResponse = { quakes: Quake[]; updatedAt: string; error?: string };

export type TrackPoint = {
  time: string;
  lon: number;
  lat: number;
  wind: number | null; // 近中心最大風速 m/s
  gust: number | null;
  pressure: number | null; // hPa
  speed: number | null; // 移動速度 km/h
  dir: string;
  radius: number | null; // 分析點：七級風暴風半徑；預測點：70% 機率半徑（公里）
  radius25: number | null; // 十級風暴風半徑（公里）
  prediction: string; // 氣象署的移動預測文字，例如「以每小時14轉21公里速度，向西北轉北北西進行」
  tau: number | null; // 預測點：幾小時後
};

export type Cyclone = {
  name: string; // 中文名（還是熱帶性低氣壓時可能是空的）
  en: string;
  label: string; // 顯示用：強烈颱風 薔琵 / 熱帶性低氣壓 TD12
  past: TrackPoint[];
  forecast: TrackPoint[];
};

export type TyphoonResponse = { cyclones: Cyclone[]; updatedAt: string; error?: string };

// 震度排序：0級 < 1級 < … < 5弱 < 5強 < 6弱 < 6強 < 7級
export function intensityRank(s: string) {
  const m = s.match(/(\d)\s*(弱|強)?/);
  if (!m) return -1;
  const n = Number(m[1]);
  return n * 2 + (m[2] === '強' ? 1 : 0);
}

// 天氣文字 → 圖示
export function wxIcon(wx: string) {
  if (wx.includes('雪')) return '🌨️';
  if (wx.includes('雷')) return '⛈️';
  if (wx.includes('雨')) return wx.includes('晴') ? '🌦️' : '🌧️';
  if (wx.includes('霧')) return '🌫️';
  if (wx.includes('陰')) return '☁️';
  if (wx.includes('多雲')) return wx.includes('晴') ? '🌤️' : '⛅';
  if (wx.includes('晴')) return '☀️';
  return '🌡️';
}
