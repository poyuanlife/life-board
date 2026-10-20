import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/lib/theme';

// 先用固定城市清單，之後可以改成用手機定位
const CITIES = [
  { name: '台北', lat: 25.04, lon: 121.56 },
  { name: '新北', lat: 25.01, lon: 121.46 },
  { name: '桃園', lat: 24.99, lon: 121.31 },
  { name: '台中', lat: 24.15, lon: 120.67 },
  { name: '台南', lat: 22.99, lon: 120.21 },
  { name: '高雄', lat: 22.63, lon: 120.3 },
];

// Open-Meteo 天氣代碼 → 中文 + 圖示
function describe(code: number): [string, string] {
  if (code === 0) return ['☀️', '晴'];
  if (code <= 2) return ['🌤️', '多雲時晴'];
  if (code === 3) return ['☁️', '陰'];
  if (code <= 48) return ['🌫️', '霧'];
  if (code <= 57) return ['🌦️', '毛毛雨'];
  if (code <= 67) return ['🌧️', '雨'];
  if (code <= 77) return ['🌨️', '雪'];
  if (code <= 82) return ['🌦️', '陣雨'];
  return ['⛈️', '雷雨'];
}

type Weather = {
  current: { temperature_2m: number; apparent_temperature: number; weather_code: number; relative_humidity_2m: number };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

export function WeatherCard() {
  const t = useTheme();
  const [city, setCity] = useState(CITIES[0]);
  const [data, setData] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=Asia%2FTaipei&forecast_days=5';
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [city]);

  const [icon, label] = data ? describe(data.current.weather_code) : ['', ''];

  return (
    <Card title="當地天氣" icon="🌡️">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CITIES.map((c) => {
          const active = c.name === city.name;
          return (
            <Pressable
              key={c.name}
              onPress={() => setCity(c)}
              style={[styles.chip, { backgroundColor: active ? t.accent : t.chip }]}>
              <Text style={{ color: active ? '#fff' : t.text, fontSize: 13 }}>{c.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!data && !error && <ActivityIndicator />}
      {error && <Text style={{ color: t.up }}>讀取失敗：{error}</Text>}
      {data && (
        <>
          <View style={styles.now}>
            <Text style={styles.bigIcon}>{icon}</Text>
            <View>
              <Text style={[styles.temp, { color: t.text }]}>{Math.round(data.current.temperature_2m)}°</Text>
              <Text style={{ color: t.muted }}>
                {label}・體感 {Math.round(data.current.apparent_temperature)}°・濕度 {data.current.relative_humidity_2m}%
              </Text>
            </View>
          </View>
          <View style={styles.days}>
            {data.daily.time.map((d, i) => {
              const [dIcon] = describe(data.daily.weather_code[i]);
              const day = i === 0 ? '今天' : `週${WEEKDAY[new Date(d).getDay()]}`;
              return (
                <View key={d} style={styles.day}>
                  <Text style={{ color: t.muted, fontSize: 12 }}>{day}</Text>
                  <Text style={{ fontSize: 20 }}>{dIcon}</Text>
                  <Text style={{ color: t.text, fontSize: 13 }}>
                    {Math.round(data.daily.temperature_2m_max[i])}°/{Math.round(data.daily.temperature_2m_min[i])}°
                  </Text>
                  <Text style={{ color: t.accent, fontSize: 11 }}>☔ {data.daily.precipitation_probability_max[i]}%</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigIcon: { fontSize: 48 },
  temp: { fontSize: 40, fontWeight: '700' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 2 },
});
