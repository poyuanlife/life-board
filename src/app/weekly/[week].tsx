import { StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { H1, H2, Muted, P } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta } from '@/lib/meta';
import { useTheme } from '@/lib/theme';
import { weekRange, type WeeklyArticle } from '@/lib/weekly';
import weekly from '@/content/weekly.json';

const articles = weekly as WeeklyArticle[];

// 建置網站時，替每一篇文章產生一個靜態網頁（/weekly/2026-10-19 這種網址）
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return articles.map((a) => ({ week: a.week }));
}

export function generateMetadata(_: unknown, params: { week?: string }) {
  const a = articles.find((x) => x.week === params?.week);
  return a ? meta(`${a.title}｜生活物價看板`, a.summary) : meta('找不到文章｜生活物價看板', '找不到這一週的物價觀察。');
}

export default function WeeklyArticlePage() {
  const t = useTheme();
  const { week } = useLocalSearchParams<{ week: string }>();
  const idx = articles.findIndex((a) => a.week === week);
  const a = articles[idx];

  if (!a) {
    return (
      <SiteLayout title="找不到文章｜生活物價看板" description="找不到這一週的物價觀察。" maxWidth={760}>
        <H1>找不到這一週的文章</H1>
        <Link href="/weekly" style={{ color: t.accent }}>
          ← 回到每週觀察
        </Link>
      </SiteLayout>
    );
  }

  const newer = articles[idx - 1];
  const older = articles[idx + 1];

  return (
    <SiteLayout title={`${a.title}｜生活物價看板`} description={a.summary} maxWidth={760}>
      <Link href="/weekly" style={{ color: t.accent, fontSize: 14 }}>
        ← 每週物價觀察
      </Link>

      <View style={{ gap: 8 }}>
        <Muted>
          {weekRange(a)}
          {a.final ? '' : '・本週更新中'}・最後更新 {new Date(a.updatedAt).toLocaleDateString('zh-TW')}
        </Muted>
        <H1>{a.title}</H1>
      </View>

      <View style={[styles.summary, { backgroundColor: t.iconBg }]}>
        <Text style={{ color: t.text, fontSize: 16, lineHeight: 28 }}>{a.summary}</Text>
      </View>

      {a.sections.map((s) => (
        <View key={s.heading} style={{ gap: 8 }}>
          <H2>{s.heading}</H2>
          {s.paragraphs.map((p, i) => (
            <P key={i}>{p}</P>
          ))}
        </View>
      ))}

      <Link href="/" style={{ color: t.accent, fontSize: 15, marginTop: 8 }}>
        📊 看今日最新物價與 8 週 K 線 →
      </Link>

      <View style={[styles.pager, { borderColor: t.border }]}>
        {older ? (
          <Link href={`/weekly/${older.week}`} style={[styles.pagerLink, { color: t.accent }]}>
            ← 上一週{'\n'}
            <Text style={{ color: t.muted, fontSize: 13 }}>{weekRange(older)}</Text>
          </Link>
        ) : (
          <View />
        )}
        {newer ? (
          <Link href={`/weekly/${newer.week}`} style={[styles.pagerLink, { color: t.accent, textAlign: 'right' }]}>
            下一週 →{'\n'}
            <Text style={{ color: t.muted, fontSize: 13 }}>{weekRange(newer)}</Text>
          </Link>
        ) : (
          <View />
        )}
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 12, padding: 16 },
  pager: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 16, marginTop: 8 },
  pagerLink: { fontSize: 15, lineHeight: 22 },
});
