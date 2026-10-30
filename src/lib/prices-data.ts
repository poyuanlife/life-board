import type { PricesResponse } from './series';
import raw from '../../public/data/prices.json';

// 建置網站時就把當天價格寫進網頁裡，打開就看得到，不用等程式跑完再下載一次。
// （GitHub Actions 每天早上先執行 fetch-prices，再建置網站，所以這裡永遠是最新的資料。）
export const PRICES = raw as PricesResponse;

/**
 * 以台灣時間顯示，例如 2026/10/24 14:21（建置主機是 UTC，使用者可能在別的時區）。
 * 自己組字串，不用 toLocaleString：伺服器和瀏覽器產生的空白字元不同，會讓 React 判定畫面對不上（錯誤 #418）。
 */
export function taipeiTime(iso: string) {
  const d = new Date(Date.parse(iso) + 8 * 3600000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}
