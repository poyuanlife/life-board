export type YouTubeVideo = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
  views: number | null;
  duration: string; // ISO 8601，例如 PT4M13S
};

export type YouTubeResponse = {
  videos: YouTubeVideo[];
  updatedAt: string | null;
  error?: string;
};

/** 觀看次數：1.2 萬、3,456 */
export function formatViews(n: number | null) {
  if (n == null) return '';
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)} 億次觀看`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 萬次觀看`;
  return `${n.toLocaleString('en-US')} 次觀看`;
}

/** PT1H2M3S → 1:02:03、PT4M5S → 4:05 */
export function formatDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const [h, min, s] = [m[1], m[2], m[3]].map((x) => Number(x ?? 0));
  const pad = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}
