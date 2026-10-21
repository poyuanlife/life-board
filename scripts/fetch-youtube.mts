/// <reference types="node" />
// 抓 YouTube 台灣熱門影片前 10 名，存成 public/data/youtube.json。
// 需要環境變數 YOUTUBE_API_KEY（GitHub Actions 從 Secrets 帶入）。
// 執行：npm run fetch-youtube
// 這支失敗不會讓網站發布失敗，頁面會顯示「暫時無法取得」。

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { YouTubeResponse, YouTubeVideo } from '../src/lib/youtube.ts';

const out = join(import.meta.dirname, '..', 'public', 'data', 'youtube.json');
const gh = !!process.env.GITHUB_ACTIONS;

function save(data: YouTubeResponse) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(data));
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn(gh ? '::warning::沒有設定 YOUTUBE_API_KEY，YouTube 熱門頁會是空的' : '⚠️ 沒有設定 YOUTUBE_API_KEY');
    // 本機沒有金鑰時保留舊檔案；沒有舊檔就寫一個空的，網站才建置得起來
    if (!existsSync(out)) save({ videos: [], updatedAt: null, error: '尚未設定' });
    return;
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.search = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    chart: 'mostPopular',
    regionCode: 'TW',
    hl: 'zh-TW',
    maxResults: '10',
    key,
  }).toString();

  try {
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    const videos: YouTubeVideo[] = (body.items ?? []).map((v: any) => ({
      id: v.id,
      // 有中文翻譯標題就用中文
      title: v.snippet.localized?.title ?? v.snippet.title,
      channel: v.snippet.channelTitle,
      thumbnail: (v.snippet.thumbnails.medium ?? v.snippet.thumbnails.default).url,
      publishedAt: v.snippet.publishedAt,
      views: v.statistics?.viewCount != null ? Number(v.statistics.viewCount) : null,
      duration: v.contentDetails?.duration ?? '',
    }));
    if (!videos.length) throw new Error('YouTube 回傳 0 部影片');
    save({ videos, updatedAt: new Date().toISOString() });
    console.log(`✅ YouTube 熱門 ${videos.length} 部 → ${out}`);
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e).slice(0, 200);
    console.warn(gh ? `::warning::YouTube：${msg}` : `⚠️ YouTube：${msg}`);
    if (!existsSync(out)) save({ videos: [], updatedAt: null, error: msg });
  }
}

main();
