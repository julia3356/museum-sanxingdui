import { content } from '../data/content';
import { BottomNav } from './shared';

export function SourcesPage() {
  return (
    <main className="page with-nav">
      <header className="sub-hero">
        <div className="eyebrow">来源说明</div>
        <h1>信息来源与版权</h1>
        <p>{content.copyrightNotice}</p>
      </header>

      <section className="source-list">
        {content.sources.map((source) => (
          <a className="source-card" href={source.url} key={source.id} target="_blank" rel="noreferrer">
            <span>{source.id}</span>
            <strong>{source.label}</strong>
            <em>{source.url}</em>
          </a>
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
