import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { ExtLink } from '@/components/ExtLink';
import { LiveEmbed } from '@/components/LiveEmbed';
import { H1, Muted } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { TyphoonMap } from '@/components/TyphoonMap';
import {
  intensityRank,
  wxIcon,
  type Period,
  type Quake,
  type QuakeResponse,
  type TyphoonResponse,
  type WeatherResponse,
} from '@/lib/cwa';
import { meta, PAGES } from '@/lib/meta';
import { taipeiTime } from '@/lib/prices-data';
import { taipeiToday } from '@/lib/series';
import { useStoredState } from '@/lib/storage';
import { useTheme, type Theme } from '@/lib/theme';
import type { YouTubeResponse } from '@/lib/youtube';
import youtube from '../../public/data/youtube.json';

export function generateMetadata() {
  return meta(PAGES.weather.title, PAGES.weather.description);
}

// YouTube「台灣地震監視」目前的直播（每天早上隨 YouTube 熱門一起更新）
const LIVE_VIDEO = (youtube as YouTubeResponse).quakeLive || 'KyT4qSK8lJo';

type Load<T> = { data?: T; error?: string; loading: boolean };

/** 打開頁面時向本站的 /api 抓最新資料；every 秒數 > 0 時會定時重抓 */
function useApi<T extends { error?: string }>(path: string, every = 0) {
  const [state, setState] = useState<Load<T>>({ loading: true });
  const load = useCallback(async () => {
    try {
      const res = await fetch(path);
      const body = (await res.json()) as T;
      if (!res.ok || body.error) throw new Error(body.error ?? `HTTP ${res.status}`);
      setState({ data: body, loading: false });
    } catch (e) {
      // 重抓失敗時保留舊資料
      setState((s) => ({ data: s.data, loading: false, error: s.data ? undefined : String(e instanceof Error ? e.message : e) }));
    }
  }, [path]);
  useEffect(() => {
    load();
    if (!every) return;
    const id = setInterval(load, every * 1000);
    return () => clearInterval(id);
  }, [load, every]);
  return state;
}

function Status({ state, what }: { state: Load<unknown>; what: string }) {
  const t = useTheme();
  if (state.loading) return <ActivityIndicator color={t.accent} style={{ paddingVertical: 20 }} />;
  if (state.error)
    return <Text style={{ color: t.muted, fontSize: 14 }}>暫時無法取得{what}，請稍後重新整理。（{state.error}）</Text>;
  return null;
}

// ---------- 天氣 ----------

/** 2026-10-22 18:00:00 → 今天晚上 */
function periodLabel(p: Period) {
  const date = p.start.slice(0, 10);
  const hour = Number(p.start.slice(11, 13));
  const today = taipeiToday();
  const tomorrow = new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10);
  const day = date === today ? '今天' : date === tomorrow ? '明天' : `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
  const part = hour >= 18 ? '晚上' : hour >= 12 ? '下午' : hour >= 6 ? '白天' : '凌晨';
  return `${day}${part}`;
}

function WeatherSection() {
  const t = useTheme();
  const state = useApi<WeatherResponse>('/api/weather');
  const [pref, setPref] = useStoredState('weather-county', { name: '臺北市' });
  const counties = state.data?.counties ?? [];
  const c = counties.find((x) => x.name === pref.name) ?? counties[0];

  return (
    <Card title="天氣溫度" icon="🌡️">
      <Status state={state} what="天氣資料" />
      {c && (
        <>
          <View style={styles.chips}>
            {counties.map((x) => {
              const on = x.name === c.name;
              return (
                <Pressable
                  key={x.name}
                  onPress={() => setPref({ name: x.name })}
                  style={[styles.chip, { borderColor: on ? t.accent : t.border, backgroundColor: on ? t.chip : 'transparent' }]}>
                  <Text style={{ color: on ? t.text : t.muted, fontSize: 13, fontWeight: on ? '700' : '400' }}>{x.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {c.now && (
            <View style={[styles.now, { backgroundColor: t.iconBg }]}>
              <Text style={{ fontSize: 40 }}>{wxIcon(c.now.weather || c.periods[0]?.wx || '')}</Text>
              <View style={{ flex: 1, minWidth: 140 }}>
                <Text style={[styles.temp, { color: t.text }]}>{c.now.temp.toFixed(1)}°C</Text>
                <Text style={{ color: t.muted, fontSize: 13 }}>
                  {[c.now.weather, c.now.humidity != null && `濕度 ${Math.round(c.now.humidity)}%`].filter(Boolean).join('・')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                {c.now.high != null && c.now.low != null && (
                  <Text style={{ color: t.text, fontSize: 13, fontVariant: ['tabular-nums'] }}>
                    今日 {c.now.low.toFixed(0)}～{c.now.high.toFixed(0)}°C
                  </Text>
                )}
                <Text style={{ color: t.faint, fontSize: 11 }}>
                  {c.now.station}測站・{c.now.time ? taipeiTime(c.now.time).slice(-8, -3) : ''} 觀測
                </Text>
              </View>
            </View>
          )}

          <View style={styles.periods}>
            {c.periods.slice(0, 3).map((p) => (
              <View key={p.start} style={[styles.period, { borderColor: t.border }]}>
                <Text style={{ color: t.muted, fontSize: 12 }}>{periodLabel(p)}</Text>
                <Text style={{ fontSize: 28 }}>{wxIcon(p.wx)}</Text>
                <Text style={{ color: t.text, fontSize: 13, textAlign: 'center' }} numberOfLines={2}>
                  {p.wx}
                </Text>
                {p.min != null && p.max != null && (
                  <Text style={{ color: t.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                    {p.min}～{p.max}°
                  </Text>
                )}
                {p.pop != null && <Text style={{ color: t.accent, fontSize: 12 }}>☔ 降雨 {p.pop}%</Text>}
                {!!p.ci && <Text style={{ color: t.faint, fontSize: 11 }}>{p.ci}</Text>}
              </View>
            ))}
          </View>
          <Muted>中央氣象署 36 小時天氣預報與即時觀測，約 10 分鐘更新一次。</Muted>
        </>
      )}
    </Card>
  );
}

// ---------- 地震 ----------

function intensityColor(level: string, t: Theme) {
  const r = intensityRank(level);
  if (r >= 10) return '#7b1fa2'; // 5弱以上
  if (r >= 8) return t.up; // 4級
  if (r >= 6) return '#f57c00'; // 3級
  if (r >= 4) return t.flat; // 2級
  return t.down;
}

function QuakeRow({ q }: { q: Quake }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const color = intensityColor(q.maxIntensity, t);
  return (
    <Pressable onPress={() => setOpen(!open)} style={[styles.quake, { borderColor: t.border }]}>
      <View style={styles.quakeTop}>
        <View style={[styles.mag, { backgroundColor: color }]}>
          <Text style={{ color: '#fff', fontSize: 10 }}>規模</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{q.mag?.toFixed(1) ?? '-'}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>
            {q.location.replace(/^.*?\((.*)\)$/, '$1') || q.location}
          </Text>
          <Text style={{ color: t.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>
            {q.time.slice(5, 16).replace('-', '/')}・深度 {q.depth ?? '-'} 公里{q.big ? `・第 ${q.no.slice(-3)} 號` : ''}
          </Text>
        </View>
        {!!q.maxIntensity && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: t.faint, fontSize: 10 }}>最大震度</Text>
            <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{q.maxIntensity.replace('級', '')}</Text>
          </View>
        )}
      </View>
      {open && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.muted, fontSize: 13 }}>{q.location}</Text>
          <View style={styles.chips}>
            {q.areas.map((a) => (
              <Text key={a.county} style={[styles.area, { color: t.text, backgroundColor: t.iconBg }]}>
                {a.county} {a.intensity}
              </Text>
            ))}
          </View>
          {!!q.image && <Image source={{ uri: q.image }} style={styles.report} resizeMode="contain" accessibilityLabel="地震報告圖" />}
          {q.web.startsWith('https://') && <ExtLink href={q.web as `https://${string}`}>氣象署地震報告</ExtLink>}
        </View>
      )}
    </Pressable>
  );
}

function QuakeSection() {
  const t = useTheme();
  const state = useApi<QuakeResponse>('/api/quakes', 60);
  return (
    <Card title="地震資訊" icon="🌏">
      <LiveEmbed videoId={LIVE_VIDEO} title="台灣地震監視" />
      <Muted>
        即時畫面來自 YouTube 頻道
        <ExtLink href="https://www.youtube.com/channel/UCa32OtZqhDqDqCHeWO477qg">台灣地震監視</ExtLink>
        ，版權屬原作者，本站僅透過 YouTube 官方播放器嵌入。下方為中央氣象署地震報告，頁面開著時每分鐘自動更新。本頁不是地震預警，請以手機強震即時警報為準。
      </Muted>
      <Status state={state} what="地震報告" />
      {state.data && state.data.quakes.length === 0 && <Text style={{ color: t.muted }}>最近沒有有感地震。</Text>}
      <View style={{ gap: 8 }}>
        {state.data?.quakes.map((q) => <QuakeRow key={q.no + q.time} q={q} />)}
      </View>
      {state.data && <Muted>點一下地震可看各縣市震度與報告圖。最後更新：{taipeiTime(state.data.updatedAt)}</Muted>}
    </Card>
  );
}

// ---------- 颱風 ----------

function TyphoonSection() {
  const t = useTheme();
  const state = useApi<TyphoonResponse>('/api/typhoon');
  const list = state.data?.cyclones ?? [];
  return (
    <Card title="颱風動態" icon="🌀">
      <Status state={state} what="颱風資料" />
      {state.data && list.length === 0 && (
        <View style={[styles.now, { backgroundColor: t.iconBg }]}>
          <Text style={{ fontSize: 28 }}>😌</Text>
          <Text style={{ color: t.text, flex: 1 }}>目前西北太平洋沒有颱風或熱帶性低氣壓。</Text>
        </View>
      )}
      {list.length > 0 && (
        <>
          <TyphoonMap cyclones={list} />
          <View style={styles.legend}>
            <Text style={{ color: t.up, fontSize: 12 }}>━ 過去路徑</Text>
            <Text style={{ color: t.flat, fontSize: 12 }}>╍ 預測路徑（圓圈為 70% 機率範圍）</Text>
          </View>
          {list.map((c) => {
            const now = c.past[c.past.length - 1];
            return (
              <View key={c.label} style={[styles.quake, { borderColor: t.border }]}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                  {c.label}
                  {c.name && c.en ? `（${c.en}）` : ''}
                </Text>
                <Text style={{ color: t.muted, fontSize: 13, lineHeight: 20 }}>
                  {[
                    `位置 北緯 ${now.lat.toFixed(1)}°、東經 ${now.lon.toFixed(1)}°`,
                    now.wind != null && `中心風速 ${now.wind} m/s${now.gust != null ? `（陣風 ${now.gust}）` : ''}`,
                    now.pressure != null && `氣壓 ${now.pressure} hPa`,
                    now.dir && now.speed != null && `往${now.dir}移動，時速 ${now.speed} 公里`,
                    now.radius != null && `七級風暴風半徑 ${now.radius} 公里`,
                  ]
                    .filter(Boolean)
                    .join('・')}
                </Text>
                {!!now.time && <Text style={{ color: t.faint, fontSize: 11 }}>{taipeiTime(now.time)} 分析</Text>}
              </View>
            );
          })}
        </>
      )}
      <Muted>
        資料來自中央氣象署颱風路徑，約每 3 小時更新。颱風警報與詳細說明請看
        <ExtLink href="https://www.cwa.gov.tw/V8/C/P/Typhoon/TY_NEWS.html">氣象署颱風消息</ExtLink>。
      </Muted>
    </Card>
  );
}

export default function WeatherPage() {
  return (
    <SiteLayout title={PAGES.weather.title} description={PAGES.weather.description} maxWidth={860}>
      <View style={{ gap: 6 }}>
        <H1>天氣・地震・颱風</H1>
        <Muted>中央氣象署開放資料，打開頁面時即時抓取最新資料。</Muted>
      </View>
      <WeatherSection />
      <QuakeSection />
      <TyphoonSection />
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  now: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, flexWrap: 'wrap' },
  temp: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
  periods: { flexDirection: 'row', gap: 8 },
  period: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
  quake: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  quakeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mag: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  area: { fontSize: 12, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  report: { width: '100%', aspectRatio: 1, maxWidth: 480, alignSelf: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
