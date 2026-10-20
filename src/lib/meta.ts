import type { Metadata } from 'expo-router/server';

// 給每個頁面的 generateMetadata() 用：建置時把標題和摘要寫進 HTML，搜尋引擎看得到
export function meta(title: string, description: string): Metadata {
  return { title, description, openGraph: { title, description } };
}

export const PAGES = {
  home: {
    title: '生活物價看板｜今日油價、匯率、菜價、蛋價一次看',
    description:
      '每天自動更新的台灣生活物價：中油油價、日圓美元匯率、高麗菜等蔬果批發價、雞蛋與豬肉行情，用 K 線和紅綠燈看懂本週漲跌。',
  },
  weekly: {
    title: '每週物價觀察｜生活物價看板',
    description: '每週整理台灣油價、匯率、蔬果與肉蛋價格的漲跌重點，用數字看懂這週什麼變貴、什麼變便宜。',
  },
  about: {
    title: '關於本站｜生活物價看板',
    description:
      '生活物價看板整理中油、農業部等政府開放資料，每天自動更新油價、匯率、菜價與肉蛋行情。說明資料來源、更新頻率與閱讀方式。',
  },
  privacy: {
    title: '隱私權政策｜生活物價看板',
    description: '生活物價看板的隱私權政策，說明本站如何處理瀏覽資料、Cookie 與第三方廣告。',
  },
};
