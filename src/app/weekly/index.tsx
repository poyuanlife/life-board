import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { H1, Muted } from '@/components/Prose';
import { SiteLayout } from '@/components/SiteLayout';
import { meta, PAGES } from '@/lib/meta';
import { useTheme } from '@/lib/theme';
import { weekRange, type WeeklyArticle } from '@/lib/weekly';
import weekly from '@/content/weekly.json';

const articles = weekly as WeeklyArticle[];

export function generateMetadata() {
  return meta(PAGES.weekly.title, PAGES.weekly.description);
}

export default function WeeklyList() {
  const t = useTheme();
  return (
    <SiteLayout
      title={PAGES.weekly.title}
      description={PAGES.weekly.description}
      maxWidth={760}>
      <View style={{ gap: 6 }}>
        <H1>每週物價觀察</H1>
        <Muted>每週整理油價、匯率、蔬果與肉蛋的漲跌重點。本週文章會每天依最新行情更新，週日結束後定稿。</Muted>
      </View>

      <View style={{ gap: 12 }}>
        {articles.map((a) => (
          <Link key={a.week} href={`/weekly/${a.week}`} asChild>
            {/* Link asChild 在網頁版需要單一 style 物件，不能是陣列 */}
            <Pressable style={StyleSheet.flatten([styles.card, { backgroundColor: t.card, borderColor: t.border }])}>
              <View style={styles.meta}>
                <Text style={{ color: t.faint, fontSize: 12 }}>{weekRange(a)}</Text>
                {!a.final && (
                  <Text style={[styles.badge, { color: t.accent, borderColor: t.accent }]}>本週・更新中</Text>
                )}
              </View>
              <Text style={[styles.title, { color: t.text }]}>{a.title}</Text>
              <Text style={{ color: t.muted, fontSize: 14, lineHeight: 22 }} numberOfLines={2}>
                {a.summary}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SiteLayout>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { fontSize: 11, borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
});
