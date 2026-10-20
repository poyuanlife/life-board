import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/theme';

// 文章頁共用的文字樣式

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.h1, { color: t.text }]} role="heading" aria-level={1}>{children}</Text>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  const t = useTheme();
  return (
    <Text style={[styles.h2, { color: t.text }]} role="heading" aria-level={2} nativeID={id}>
      {children}
    </Text>
  );
}

export function P({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.p, { color: t.text }]}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.faint, fontSize: 13, lineHeight: 20 }}>{children}</Text>;
}

export function Li({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.li}>
      <Text style={[styles.p, { color: t.muted }]}>•</Text>
      <Text style={[styles.p, { color: t.text, flex: 1 }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', lineHeight: 38 },
  h2: { fontSize: 20, fontWeight: '700', marginTop: 12, lineHeight: 28 },
  p: { fontSize: 16, lineHeight: 28 },
  li: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
});
