// 網頁版：嵌入 YouTube 直播（用頻道 ID，直播重開換網址也不會失效）
export function LiveEmbed({ channelId, title }: { channelId: string; title: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      <iframe
        src={`https://www.youtube.com/embed/live_stream?channel=${channelId}&mute=1`}
        title={title}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
      />
    </div>
  );
}
