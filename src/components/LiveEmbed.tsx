import { ExtLink } from './ExtLink';

// App 版：沒有網頁嵌入，改成連結到 YouTube
export function LiveEmbed({ channelId, title }: { channelId: string; title: string }) {
  return <ExtLink href={`https://www.youtube.com/channel/${channelId}/live`}>{`▶ 觀看「${title}」直播`}</ExtLink>;
}
