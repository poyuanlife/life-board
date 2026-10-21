import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { H1, Muted } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import { taipeiTime } from '@/lib/prices-data';
import { useTheme } from '@/lib/theme';
import { formatDuration, formatViews, type YouTubeResponse } from '@/lib/youtube';
import raw from '../../public/data/youtube.json';

const DATA = raw as YouTubeResponse;

export function generateMetadata() {
  return meta(PAGES.youtube.title, PAGES.youtube.description);
}

export default function YouTubeTop() {
  const t = useTheme();
  return (
    <SiteLayout title={PAGES.youtube.title} description={PAGES.youtube.description} maxWidth={760}>
      <View style={{ gap: 6 }}>
        <H1>YouTube 台灣熱門 Top 10</H1>
        <Muted>
          YouTube 官方提供的台灣熱門影片，以音樂、電影預告與遊戲為主，每天早上 7 點更新。
          {DATA.updatedAt ? `（更新時間：${taipeiTime(DATA.updatedAt)}）` : ''}
        </Muted>
      </View>

      {DATA.videos.length === 0 && (
        <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={{ color: t.muted }}>暫時無法取得熱門影片，請稍後再來看看。</Text>
        </View>
      )}

      <View style={{ gap: 10 }}>
        {DATA.videos.map((v, i) => (
          <Link key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" asChild>
            {/* Link asChild 在網頁版需要單一 style 物件，不能是陣列 */}
            <Pressable style={StyleSheet.flatten([styles.card, styles.row, { backgroundColor: t.card, borderColor: t.border }])}>
              <Text style={[styles.rank, { color: i < 3 ? t.up : t.faint }]}>{i + 1}</Text>
              <View>
                <Image source={{ uri: v.thumbnail }} style={styles.thumb} accessibilityLabel={v.title} />
                {!!v.duration && <Text style={styles.duration}>{formatDuration(v.duration)}</Text>}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>
                  {v.title}
                </Text>
                <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={1}>
                  {v.channel}
                </Text>
                <Text style={{ color: t.faint, fontSize: 12 }}>{formatViews(v.views)}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      <Muted>點影片會在新分頁開啟 YouTube。影片內容與排名來自 YouTube，本站不負責影片內容。</Muted>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 24, fontSize: 20, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  thumb: { width: 128, height: 72, borderRadius: 8, backgroundColor: '#000' },
  duration: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.75)',
    fontSize: 11,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontVariant: ['tabular-nums'],
  },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
});
