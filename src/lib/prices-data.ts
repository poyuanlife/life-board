import type { PricesResponse } from './series';
import raw from '../../public/data/prices.json';

// 建置網站時就把當天價格寫進網頁裡，打開就看得到，不用等程式跑完再下載一次。
// （GitHub Actions 每天早上先執行 fetch-prices，再建置網站，所以這裡永遠是最新的資料。）
export const PRICES = raw as PricesResponse;

/** 以台灣時間顯示，避免建置主機（UTC）和使用者瀏覽器顯示的時間不一樣 */
export function taipeiTime(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
}
