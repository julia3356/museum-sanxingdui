import { content } from '../data/content';
import { getPlayableVideoUrl, getSegment, getThumbnailUrl, resolveTheme } from '../lib/paths';
import { BottomNav, LinkButton } from './shared';

export function SegmentDetail({ id }: { id: number }) {
  const segment = getSegment(id) || content.browseIndex[0];
  const videoUrl = getPlayableVideoUrl(segment);
  const next = getSegment(segment.id + 1);

  return (
    <main className="page with-nav">
      <section className="detail-media">
        {videoUrl ? (
          <video src={videoUrl} controls playsInline poster={getThumbnailUrl(segment.thumbnail)} />
        ) : (
          <div
            className="video-placeholder"
            style={{ backgroundImage: `url(${getThumbnailUrl(segment.thumbnail)})` }}
          >
            <span>视频地址待配置，可先阅读观展提示。</span>
          </div>
        )}
      </section>

      <section className="section panel">
        <div className="card-meta">
          {String(segment.id).padStart(2, '0')} · {segment.timecode} · {resolveTheme(segment.id)}
        </div>
        <h1>{segment.title}</h1>
        <p>{segment.artifactsText || segment.artifacts.join('、')}</p>
        <p className="fineprint">
          {videoUrl ? '当前使用 H5 可访问视频地址。' : '发布版视频仍为小程序云存储地址，H5 首版不直接播放。'}
        </p>
        <div className="action-row compact">
          <LinkButton to={`/sanxingdui/ask/${segment.id}`} className="button primary">
            问这件展品
          </LinkButton>
          {segment.hasExtensionReading ? (
            <LinkButton to={`/sanxingdui/readings/${segment.id}`} className="button secondary">
              延伸阅读
            </LinkButton>
          ) : null}
          {next ? (
            <LinkButton to={`/sanxingdui/segments/${next.id}`} className="button secondary">
              下一段
            </LinkButton>
          ) : (
            <LinkButton to="/sanxingdui/segments" className="button secondary">
              返回列表
            </LinkButton>
          )}
        </div>
      </section>

      <section className="section panel">
        <div className="card-meta">观展提示</div>
        <p className="script">{segment.viewingGuide || segment.guideScript}</p>
        <div className="tip-list">
          {(segment.guideTips || []).map((tip) => (
            <article className="guide-tip" key={`${tip.label}-${tip.text}`}>
              <strong>{tip.label}</strong>
              <span>{tip.text}</span>
            </article>
          ))}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
