import { ActivityIndicator, Text } from 'react-native';
import type { Load } from '@/lib/useApi';
import { useTheme } from '@/lib/theme';

/** 讀取中顯示轉圈；失敗顯示說明；成功什麼都不顯示 */
export function ApiStatus({ state, what }: { state: Load<unknown>; what: string }) {
  const t = useTheme();
  if (state.loading) return <ActivityIndicator color={t.accent} style={{ paddingVertical: 20 }} />;
  // 技術細節（例如 Failed to fetch）一般人看不懂，只說發生什麼事、該怎麼做
  if (state.error) return <Text style={{ color: t.muted, fontSize: 14 }}>暫時無法取得{what}，可能是網路不穩，請稍後重新整理。</Text>;
  return null;
}
