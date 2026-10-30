// 首頁用的精簡版天氣、地震、颱風卡片（完整內容在「天氣地震」頁）
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ApiStatus } from './ApiStatus';
import { Card } from './Card';
import { intensityColor, periodLabel, wxIcon, type QuakeResponse, type TyphoonResponse, type WeatherResponse } from '@/lib/cwa';
import { taipeiToday } from '@/lib/series';
import { useStoredState } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { useApi } from '@/lib/useApi';
import { computeEnergy, DEFAULT_PROFILE, type Profile } from './EnergyCalculator';
import { dayTotals, EMPTY_LOG, getDay, hasRecord, localDate, type Log } from '@/lib/diary';
import { formatViews, type YouTubeResponse } from '@/lib/youtube';
import youtubeRaw from '../../public/data/youtube.json';

const YT = youtubeRaw as YouTubeResponse;

function More({ menu, href = '/weather' }: { menu?: ReactNode; href?: '/weather' | '/calories' | '/youtube' }) {
  const t = useTheme();
  return (
    <View style={styles.right}>
      <Link href={href} style={{ color: t.accent, fontSize: 13 }}>
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

/** 今天吃了多少（資料來自熱量計算頁，只存在這台裝置） */
export function CaloriesMini({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  const [profile] = useStoredState<Profile>('life-board:profile', DEFAULT_PROFILE);
  const [log] = useStoredState<Log>('life-board:log', EMPTY_LOG);
  // 日期在畫面打開後才算，靜態網頁先當作沒有紀錄
  const [today, setToday] = useState('');
  useEffect(() => setToday(localDate()), []);
  const day = today ? getDay(log, today) : undefined;
  const target = computeEnergy(profile)?.target ?? null;
  const total = day ? dayTotals(day) : null;
  const eaten = total ? Math.round(total.food.kcal) : 0;
  const pct = target ? Math.min(100, (eaten / target) * 100) : 0;
  const over = target != null && eaten > target;

  return (
    <Card title="今天的熱量" icon="🍱" right={<More href="/calories" menu={menu} />}>
      {!hasRecord(day) ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.muted, fontSize: 14 }}>今天還沒有記錄吃了什麼。</Text>
          <Link href="/calories" style={{ color: t.accent, fontWeight: '700' }}>
            去記錄 →
          </Link>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ color: t.text, fontSize: 15 }}>
            已吃 <Text style={styles.big}>{eaten}</Text>
            {target ? ` / 目標 ${target} 大卡` : ' 大卡'}
          </Text>
          {target != null && (
            <View style={[styles.bar, { backgroundColor: t.border }]}>
              <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: over ? t.up : t.down }} />
            </View>
          )}
          <Text style={{ color: t.muted, fontSize: 12 }}>
            {[
              total && total.burned > 0 && `運動消耗 ${total.burned} 大卡`,
              target != null && (over ? `超過 ${eaten - target} 大卡` : `還可以吃 ${target - eaten} 大卡`),
            ]
              .filter(Boolean)
              .join('・')}
          </Text>
        </View>
      )}
    </Card>
  );
}

/** YouTube 台灣熱門前 3 名（每天早上更新） */
export function YouTubeMini({ menu }: { menu?: ReactNode }) {
  const t = useTheme();
  const list = YT.videos.slice(0, 3);
  if (!list.length) return null;
  return (
    <Card title="YouTube 熱門" icon="📺" right={<More href="/youtube" menu={menu} />}>
      {list.map((v, i) => (
        <Link key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" asChild>
          <Pressable style={styles.yt}>
            <Text style={{ color: t.up, fontWeight: '800', width: 16 }}>{i + 1}</Text>
            <Image source={{ uri: v.thumbnail }} style={styles.ytThumb} accessibilityLabel={v.title} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: t.text, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                {v.title}
              </Text>
              <Text style={{ color: t.faint, fontSize: 11 }} numberOfLines={1}>
                {[v.channel, formatViews(v.views)].filter(Boolean).join('・')}
              </Text>
            </View>
          </Pressable>
        </Link>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  yt: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ytThumb: { width: 96, height: 54, borderRadius: 6 },
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
