import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { useTheme } from '@/lib/theme';

const NAV = [
  { href: '/', label: '物價看板' },
  { href: '/weekly', label: '每週觀察' },
  { href: '/calories', label: '熱量計算' },
  { href: '/youtube', label: 'YouTube 熱門' },
  { href: '/about', label: '關於本站' },
] as const;

type Props = {
  title: string; // 瀏覽器分頁標題
  description: string; // 搜尋引擎摘要
  maxWidth?: number;
  children: ReactNode;
  onWidth?: (w: number) => void; // 回傳內容寬度（首頁用來決定欄數）
};

export function SiteLayout({ title, description, maxWidth = 1320, children, onWidth }: Props) {
  const t = useTheme();
  const path = usePathname();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.bar, { borderColor: t.border }]}>
          <View style={[styles.barInner, { maxWidth: 1320 }]}>
            <Link href="/" style={[styles.brand, { color: t.text }]}>
              🧺 生活物價看板
            </Link>
            <View style={styles.nav}>
              {NAV.map((n) => {
                const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    style={[
                      styles.navLink,
                      { color: active ? t.text : t.muted, fontWeight: active ? '700' : '400' },
                      active && { borderBottomColor: t.accent },
                    ]}>
                    {n.label}
                  </Link>
                );
              })}
            </View>
          </View>
        </View>

        <View
          style={[styles.inner, { maxWidth }]}
          onLayout={onWidth ? (e) => onWidth(e.nativeEvent.layout.width - 32) : undefined}>
          {children}
        </View>

        <View style={[styles.footer, { borderColor: t.border }]}>
          <View style={[styles.footerInner, { maxWidth: 1320 }]}>
            <View style={styles.footerLinks}>
              <Link href="/about" style={{ color: t.muted, fontSize: 13 }}>
                關於本站
              </Link>
              <Text style={{ color: t.faint }}>・</Text>
              <Link href="/about#sources" style={{ color: t.muted, fontSize: 13 }}>
                資料來源
              </Link>
              <Text style={{ color: t.faint }}>・</Text>
              <Link href="/privacy" style={{ color: t.muted, fontSize: 13 }}>
                隱私權政策
              </Link>
            </View>
            <Text style={{ color: t.faint, fontSize: 12 }}>
              © {new Date().getFullYear()} 生活物價看板・資料來自政府開放資料，僅供參考
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center', flexGrow: 1 },
  bar: { width: '100%', borderBottomWidth: 1, alignItems: 'center' },
  barInner: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brand: { fontSize: 17, fontWeight: '800' },
  nav: { flexDirection: 'row', gap: 16 },
  navLink: { fontSize: 14, paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  inner: { width: '100%', paddingHorizontal: 16, paddingVertical: 20, gap: 20, flexGrow: 1 },
  footer: { width: '100%', borderTopWidth: 1, alignItems: 'center', marginTop: 20 },
  footerInner: { width: '100%', paddingHorizontal: 16, paddingVertical: 18, gap: 6 },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
});
