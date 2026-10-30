// 首頁用的精簡版天氣、地震、颱風卡片（完整內容在「天氣地震」頁）
import { useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ApiStatus } from './ApiStatus';
import { Card } from './Card';
import { intensityColor, periodLabel, wxIcon, type QuakeResponse, type TyphoonResponse, type WeatherResponse } from '@/lib/cwa';
import { taipeiToday } from '@/lib/series';
import { useStoredState } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

function More({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.right}>
      <Link href="/weather" style={{ color: t.accent, fontSize: 13 }}>
        更多 →
      </Link>
      {menu}
    </View>
  );
}

export function WeatherMini({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  const state = useApi<WeatherResponse>('/api/weather');
  // 和天氣地震頁共用同一個縣市設定
  const [pref, setPref] = useStoredState('weather-county', { name: '臺北市' });
  const [picking, setPicking] = useState(false);
  const counties = state.data?.counties ?? [];
  const c = counties.find((x) => x.name === pref.name) ?? counties[0];
  const next = c?.periods.slice(0, 2) ?? [];

  return (
    <Card title="天氣" icon="🌡️" right={<More menu={menu} />}>
      <ApiStatus state={state} what="天氣資料" />
      {c && (
        <>
          <Pressable
            onPress={() => setPicking(!picking)}
            accessibilityLabel="切換縣市"
            style={[styles.pick, { borderColor: t.border }]}>
            <Text style={{ color: t.text, fontWeight: '700' }}>📍 {c.name}</Text>
            <Text style={{ color: t.accent, fontSize: 12 }}>{picking ? '收起' : '換縣市'}</Text>
          </Pressable>
          {picking && (
            <View style={styles.chips}>
              {counties.map((x) => (
                <Pressable
                  key={x.name}
                  onPress={() => {
                    setPref({ name: x.name });
                    setPicking(false);
                  }}
                  style={[styles.chip, { borderColor: x.name === c.name ? t.accent : t.border }]}>
                  <Text style={{ color: t.text, fontSize: 13 }}>{x.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {c.now && (
            <View style={styles.nowRow}>
              <Text style={{ fontSize: 34 }}>{wxIcon(c.now.weather || next[0]?.wx || '')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.temp, { color: t.text }]}>{c.now.temp.toFixed(1)}°C</Text>
                <Text style={{ color: t.muted, fontSize: 12 }}>
                  {[c.now.weather, c.now.low != null && c.now.high != null && `今日 ${c.now.low.toFixed(0)}～${c.now.high.toFixed(0)}°`]
                    .filter(Boolean)
                    .join('・')}
                </Text>
              </View>
            </View>
          )}
          {next.map((p) => (
            <View key={p.start} style={[styles.line, { borderColor: t.border }]}>
              <Text style={{ color: t.muted, fontSize: 13, width: 64 }}>{periodLabel(p, taipeiToday())}</Text>
              <Text style={{ fontSize: 16 }}>{wxIcon(p.wx)}</Text>
              <Text style={{ color: t.text, fontSize: 13, flex: 1, fontVariant: ['tabular-nums'] }}>
                {p.min}～{p.max}°
              </Text>
              {p.pop != null && <Text style={{ color: t.accent, fontSize: 12 }}>☔ {p.pop}%</Text>}
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

export function QuakeMini({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  const state = useApi<QuakeResponse>('/api/quakes', 240);
  const list = state.data?.quakes.slice(0, 3) ?? [];
  return (
    <Card title="最新地震" icon="🌏" right={<More menu={menu} />}>
      <ApiStatus state={state} what="地震報告" />
      {state.data && !list.length && <Text style={{ color: t.muted }}>最近沒有有感地震。</Text>}
      {list.map((q) => {
        const color = intensityColor(q.maxIntensity, t);
        return (
          <View key={q.no + q.time} style={styles.quake}>
            <View style={[styles.mag, { backgroundColor: color }]}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{q.mag?.toFixed(1) ?? '-'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                {q.location.replace(/^.*?\((.*)\)$/, '$1') || q.location}
              </Text>
              <Text style={{ color: t.muted, fontSize: 11, fontVariant: ['tabular-nums'] }}>
                {q.time.slice(5, 16).replace('-', '/')}
                {q.maxIntensity ? `・最大震度 ${q.maxIntensity}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
      <Text style={{ color: t.faint, fontSize: 11 }}>氣象署地震報告，每 4 分鐘更新・不是地震預警</Text>
    </Card>
  );
}

/** 沒有颱風時整張卡片不顯示 */
export function TyphoonMini({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  const state = useApi<TyphoonResponse>('/api/typhoon', 1800);
  const list = state.data?.cyclones ?? [];
  if (!list.length) return null;
  return (
    <Card title="颱風動態" icon="🌀" right={<More menu={menu} />}>
      {state.data?.image && (
        <Link href="/weather" asChild>
          <Pressable>
            <Image source={{ uri: state.data.image }} style={styles.pta} resizeMode="contain" accessibilityLabel="颱風路徑潛勢預報圖" />
          </Pressable>
        </Link>
      )}
      {list.map((c) => {
        const now = c.past[c.past.length - 1];
        return (
          <View key={c.label} style={{ gap: 2 }}>
            <Text style={{ color: t.text, fontWeight: '700' }}>{c.label}</Text>
            <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>
              {[now.wind != null && `風速 ${now.wind} m/s`, now.dir && now.speed != null && `往${now.dir} ${now.speed} km/h`]
                .filter(Boolean)
                .join('・')}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  temp: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 8 },
  quake: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mag: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pta: { width: '100%', aspectRatio: 956 / 700, borderRadius: 8 },
});
