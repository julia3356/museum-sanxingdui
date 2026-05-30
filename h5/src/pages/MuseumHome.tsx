import { content } from '../data/content';
import { getThumbnailUrl } from '../lib/paths';
import { LinkButton, PageHeader } from './shared';

export function MuseumHome() {
  return (
    <main className="page">
      <PageHeader
        eyebrow="21克 · 小工具"
        title="博物馆观展工具"
        subtitle="把展览拆成可浏览、可检索、可现场阅读的主题导览。首个主题接入古蜀文明看展助手。"
        action={
          <LinkButton to="/sanxingdui/" className="button primary">
            进入三星堆看展
          </LinkButton>
        }
      />

      <section className="section">
        <div className="section-title">展览主题</div>
        <article className="feature-card feature-card-media">
          <img src={getThumbnailUrl(content.browseIndex[0].thumbnail)} alt="" loading="lazy" />
          <div>
            <div className="card-meta">{content.guide.venue}</div>
            <h2>{content.guide.exhibition}</h2>
            <p>{content.guide.curatorialGoal}</p>
            <div className="stat-grid">
              <span>35 段展品导览</span>
              <span>4 条主题线索</span>
              <span>15 篇延伸阅读</span>
            </div>
            <div className="action-row compact">
              <LinkButton to="/sanxingdui/" className="button primary">
                打开主题
              </LinkButton>
              <LinkButton to="/sanxingdui/segments" className="button secondary">
                浏览展品
              </LinkButton>
            </div>
          </div>
        </article>
        <article className="muted-card">
          <div className="card-meta">即将加入</div>
          <h2>更多博物馆主题</h2>
          <p>后续展览可以按同一结构接入：主题主页、展品列表、看展提示、来源说明。</p>
        </article>
      </section>
    </main>
  );
}
