import { useCallback, useEffect, useState } from 'react';
import { PRICES } from './prices-data';

export type Load<T> = { data?: T; error?: string; loading: boolean };

// 每次部署都不一樣的版本號（建置時間），加在 API 網址上，網站更新後就不會拿到舊程式的快取
const VERSION = encodeURIComponent(PRICES.updatedAt);

/** 打開頁面時向本站的 /api 抓最新資料；every 秒數 > 0 時會定時重抓 */
export function useApi<T extends { error?: string }>(path: string, every = 0) {
  const [state, setState] = useState<Load<T>>({ loading: true });
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${path}?v=${VERSION}`);
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
    // 分頁在背景（或手機關螢幕）時不重抓，省 Cloudflare 額度；切回來時立刻補抓一次
    const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const id = setInterval(() => !hidden() && load(), every * 1000);
    const onShow = () => !hidden() && load();
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onShow);
    return () => {
      clearInterval(id);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onShow);
    };
  }, [load, every]);
  return state;
}
