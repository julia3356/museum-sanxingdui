import { content } from '../data/content';
import { sourceText } from '../lib/paths';
import { BottomNav, LinkButton } from './shared';

export function ReadingDetail({ id }: { id: number }) {
  const reading = content.extensionReadings.find((entry) => entry.id === id);

  if (!reading) {
    return (
      <main className="page with-nav">
        <section className="section panel">
          <div className="card-meta">延伸阅读</div>
          <h1>当前展品暂无延伸阅读</h1>
          <LinkButton to={`/sanxingdui/segments/${id}`} className="button secondary">
            返回展品
          </LinkButton>
        </section>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="page with-nav reading-page">
      <header className="sub-hero">
        <div className="eyebrow">延伸阅读</div>
        <h1>{reading.readerTitle}</h1>
        <p>{reading.readerLead}</p>
      </header>

      <section className="story section">
        {reading.storyParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="section panel">
        <div className="card-meta">传说线索</div>
        <p>{reading.mythCandy}</p>
      </section>

      <section className="section prompt-box">
        <div className="card-meta">带着这个问题看</div>
        <p>{reading.readerPrompt}</p>
      </section>

      <section className="section panel">
        <div className="card-meta">需要分清</div>
        <p>{reading.carefulNote}</p>
        <p className="fineprint">来源：{sourceText(reading.sourceIds)}</p>
      </section>
      <BottomNav />
    </main>
  );
}
