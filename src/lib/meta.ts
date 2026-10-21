import type { Metadata } from 'expo-router/server';

// 給每個頁面的 generateMetadata() 用：建置時把標題和摘要寫進 HTML，搜尋引擎看得到
export function meta(title: string, description: string): Metadata {
  return { title, description, openGraph: { title, description } };
}

export const PAGES = {
  home: {
    title: '生活物價看板｜今日油價、匯率、金價、菜價、魚價一次看',
    description:
      '每天自動更新的台灣生活物價：中油油價、日圓美元匯率、金價、蔬菜水果與魚貨批發價、雞蛋與豬肉行情，用 K 線和紅綠燈看懂本週漲跌，還有本週划算推薦。',
  },
  weekly: {
    title: '每週物價觀察｜生活物價看板',
    description: '每週整理台灣油價、匯率、蔬果與肉蛋價格的漲跌重點，用數字看懂這週什麼變貴、什麼變便宜。',
  },
  calories: {
    title: 'BMR、TDEE 熱量計算機與飲食份數紀錄｜生活物價看板',
    description:
      '免費計算基礎代謝率（BMR）、TDEE 與 BMI，用食物代換表「份數」記錄每天的澱粉、蛋白質、蔬菜、水果，估算熱量與三大營養素，還能記錄運動、喝水，並比較哪種蛋白質最划算。',
  },
  youtube: {
    title: 'YouTube 台灣熱門影片 Top 10｜生活物價看板',
    description: '每天更新的 YouTube 台灣熱門影片前 10 名，包含音樂、電影預告與遊戲影片，附觀看次數與片長，點了直接看。',
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
