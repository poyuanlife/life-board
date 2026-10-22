// Cloudflare Pages Functions 共用工具：向中央氣象署抓資料、快取、回傳 JSON。
// 授權碼放在 Cloudflare 的環境變數 CWA_API_KEY（部署時由 GitHub Secrets 同步過去），網頁看不到。

export type Env = { CWA_API_KEY?: string };
export type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void };

const BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/';

/** 不分大小寫取值：g(obj, 'EarthquakeInfo.Epicenter.Location') */
export function g(o: any, path: string): any {
  for (const k of path.split('.')) {
    if (o == null || typeof o !== 'object') return undefined;
    if (k in o) o = o[k];
    else {
      const f = Object.keys(o).find((x) => x.toLowerCase() === k.toLowerCase());
      o = f ? o[f] : undefined;
    }
  }
  return o;
}

/** 有些欄位只有一筆時不是陣列，統一轉成陣列 */
export const arr = (x: any): any[] => (Array.isArray(x) ? x : x == null ? [] : [x]);

/** 轉數字；氣象署用 -99、-999 代表沒有資料 */
export function num(x: any): number | null {
  const n = Number(typeof x === 'object' && x != null ? g(x, 'value') : x);
  return Number.isFinite(n) && n > -90 && x !== '' && x != null ? n : null;
}

async function fetchDataset(key: string, dataset: string, params: Record<string, string>) {
  const url = new URL(BASE + dataset);
  url.search = new URLSearchParams({ Authorization: key, format: 'JSON', ...params }).toString();
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`氣象署 ${dataset} 回應 ${res.status}`);
  const body: any = await res.json();
  if (String(body?.success) === 'false') throw new Error(`氣象署 ${dataset}：${body?.message ?? '失敗'}`);
  return body?.records ?? {};
}

function json(data: unknown, status: number, maxAge: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    },
  });
}

type Source = { dataset: string; params?: Record<string, string> };

/**
 * 建立一個 API：同時抓 sources 裡的資料集，交給 build 整理。
 * 成功的結果在 Cloudflare 快取 ttl 秒，很多人同時看也只會向氣象署抓一次。
 * 網址加 ?raw=1 會回傳氣象署原始資料（排查格式問題用，不含授權碼）。
 */
export function endpoint(ttl: number, sources: Source[], build: (records: any[]) => object) {
  return async (ctx: Ctx) => {
    const key = ctx.env.CWA_API_KEY;
    if (!key) return json({ error: '網站尚未設定氣象署授權碼' }, 503, 0);

    const url = new URL(ctx.request.url);
    const raw = url.searchParams.has('raw');
    const cache: Cache | undefined = (globalThis as any).caches?.default;
    const cacheKey = new Request(url.toString());
    if (cache && !raw) {
      const hit = await cache.match(cacheKey).catch(() => undefined);
      if (hit) return hit;
    }

    try {
      const records = await Promise.all(sources.map((s) => fetchDataset(key, s.dataset, s.params ?? {})));
      if (raw) return json(records, 200, 0);
      const res = json({ ...build(records), updatedAt: new Date().toISOString() }, 200, Math.min(ttl, 60));
      if (cache) {
        // Cloudflare 快取看 s-maxage，瀏覽器看 max-age
        const stored = new Response(res.clone().body, res);
        stored.headers.set('Cache-Control', `public, max-age=${Math.min(ttl, 60)}, s-maxage=${ttl}`);
        ctx.waitUntil(cache.put(cacheKey, stored).catch(() => undefined));
      }
      return res;
    } catch (e) {
      return json({ error: String(e instanceof Error ? e.message : e).slice(0, 200) }, 502, 0);
    }
  };
}
