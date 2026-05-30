import { content } from '../data/content';
import { getThumbnailUrl } from '../lib/paths';
import { LinkButton, PageHeader, BottomNav } from './shared';

export function SanxingduiHome() {
  return (
    <main className="page with-nav">
      <PageHeader
        eyebrow={content.guide.venue}
        title={content.guide.exhibition}
        subtitle={content.guide.curatorialGoal}
        action={
          <>
            <LinkButton to="/sanxingdui/segments" className="button primary">
              开始看展
            </LinkButton>
            <LinkButton to="/sanxingdui/ask" className="button secondary">
              问问古蜀助手
            </LinkButton>
            <LinkButton to="/" className="button secondary">
              返回工具主页
            </LinkButton>
          </>
        }
      />

      <section className="section">
        <div className="section-title">主题线索</div>
        <div className="topic-preview" aria-hidden="true">
          {content.browseIndex.slice(0, 4).map((segment) => (
            <img src={getThumbnailUrl(segment.thumbnail)} alt="" key={segment.id} loading="lazy" />
          ))}
        </div>
        <div className="theme-grid">
          {content.guide.prologueThemes.map((theme) => (
            <article className="panel" key={theme.title}>
              <div className="card-meta">{theme.entrySegments.length} 段</div>
              <h2>{theme.title}</h2>
              <p>{theme.goal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section panel">
        <div className="card-meta">AI 看展助手</div>
        <h2>问问古蜀助手</h2>
        <p>像现场导览员一样解释展品、路线和古蜀线索。H5 会优先尝试云端 Agent；未接入时使用本地展览资料回答。</p>
        <div className="action-row compact">
          <LinkButton to="/sanxingdui/ask" className="button primary">
            打开问答
          </LinkButton>
        </div>
      </section>

      <section className="section panel">
        <div className="card-meta">现场提示</div>
        <p>{content.cachePolicy.networkWarning}</p>
        <p className="fineprint">
          H5 首版不使用微信离线缓存；若视频地址尚未切换为 HTTPS CDN，可优先阅读文字导览。
        </p>
      </section>

      <section className="section panel">
        <div className="card-meta">策展说明</div>
        <div className="link-list">
          {content.guide.officialLinks.map((link) => (
            <a href={link.url} key={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </section>
      <BottomNav />
    </main>
  );
}
