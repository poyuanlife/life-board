import { Link } from 'expo-router';
import { useTheme } from '@/lib/theme';

// 外部連結：網頁版開新分頁，App 版用系統瀏覽器開啟
export function ExtLink({ href, children }: { href: `https://${string}` | `mailto:${string}`; children: string }) {
  const t = useTheme();
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" style={{ color: t.accent, textDecorationLine: 'underline' }}>
      {children}
    </Link>
  );
}
