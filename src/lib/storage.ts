import { useCallback, useEffect, useState, type SetStateAction } from 'react';
import { Platform } from 'react-native';

// 存在使用者自己瀏覽器裡的小設定（不會上傳）。無痕模式或被封鎖時就當作沒有存。
function read<T>(key: string, fallback: T): T {
  if (Platform.OS !== 'web') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (Platform.OS !== 'web') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存不了就算了，不影響使用
  }
}

/**
 * 跟 useState 一樣，但會記住上次的值。第一次畫面先用預設值，避免和靜態網頁對不上。
 * 只有在呼叫 set 時才寫入瀏覽器：區塊剛打開（或被重新擺放）時不會把預設值蓋掉使用者存的資料。
 */
export function useStoredState<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    setValue(read(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: SetStateAction<T>) =>
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        write(key, v);
        return v;
      }),
    [key],
  );

  return [value, set] as const;
}
