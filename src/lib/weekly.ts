// 每週物價觀察文章的格式（由 scripts/weekly.mts 自動產生，存在 src/content/weekly.json）

export type WeeklySection = { heading: string; paragraphs: string[] };

export type WeeklyArticle = {
  week: string; // 該週週一 YYYY-MM-DD，同時當作網址
  end: string; // 該週週日
  title: string;
  summary: string;
  avgPct: number;
  sections: WeeklySection[];
  final: boolean; // false = 這週還沒結束，內容會每天更新
  updatedAt: string;
};

export function weekRange(a: WeeklyArticle) {
  const f = (iso: string) => {
    const [, m, d] = iso.split('-');
    return `${Number(m)}/${Number(d)}`;
  };
  return `${a.week.slice(0, 4)}/${f(a.week)}–${f(a.end)}`;
}
