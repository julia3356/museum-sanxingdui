import { useMemo, useState } from 'react';
import { content } from '../data/content';
import { getThumbnailUrl, resolveTheme } from '../lib/paths';
import { BottomNav, LinkButton } from './shared';

const baseFilters = ['全部', '有延伸阅读'];

export function SegmentList() {
  const filters = [...baseFilters, ...content.guide.prologueThemes.map((theme) => theme.title)];
  const [activeFilter, setActiveFilter] = useState('全部');

  const items = useMemo(() => {
    return content.browseIndex
      .map((segment) => ({ ...segment, theme: resolveTheme(segment.id) }))
      .filter((segment) => {
        if (activeFilter === '全部') {
          return true;
        }
        if (activeFilter === '有延伸阅读') {
          return segment.hasExtensionReading;
        }
        return segment.theme === activeFilter;
      });
  }, [activeFilter]);

  return (
    <main className="page with-nav">
      <header className="sub-hero">
        <div className="eyebrow">展品浏览</div>
        <h1>35 段现场看展线索</h1>
        <p>按展线顺序浏览，也可以用主题筛选快速定位想看的器物和问题。</p>
      </header>

      <div className="filter-bar" role="tablist" aria-label="展品筛选">
        {filters.map((filter) => (
          <button
            className={filter === activeFilter ? 'filter active' : 'filter'}
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="segment-list">
        {items.map((segment) => (
          <article className="segment-card" key={segment.id}>
            <img src={getThumbnailUrl(segment.thumbnail)} alt="" loading="lazy" />
            <div className="segment-copy">
              <div className="card-meta">
                {String(segment.id).padStart(2, '0')} · {segment.timecode} · {segment.theme}
              </div>
              <h2>{segment.title}</h2>
              <p>{segment.description}</p>
              <div className="tag-row">
                {(segment.artifacts || []).slice(0, 3).map((artifact) => (
                  <span key={artifact}>{artifact}</span>
                ))}
              </div>
              <LinkButton to={`/sanxingdui/segments/${segment.id}`} className="button secondary">
                查看导览
              </LinkButton>
            </div>
          </article>
        ))}
      </section>
      <BottomNav />
    </main>
  );
}
