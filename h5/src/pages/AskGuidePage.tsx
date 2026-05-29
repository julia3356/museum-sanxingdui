import { FormEvent, useMemo, useState } from 'react';
import { askGuide, openingMessage, quickQuestions } from '../lib/askGuide';
import { getSegment } from '../lib/paths';
import { BottomNav, LinkButton } from './shared';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  sourceLabel?: string;
};

function messageId() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function renderMessage(text: string) {
  return text.split(/\n{2,}/).map((paragraph) => (
    <p key={paragraph}>
      {paragraph.replace(/\*\*/g, '')}
    </p>
  ));
}

export function AskGuidePage({ segmentId }: { segmentId?: number }) {
  const segment = segmentId ? getSegment(segmentId) : undefined;
  const questions = useMemo(() => quickQuestions(segment), [segment]);
  const [messages, setMessages] = useState<Message[]>([
    { id: messageId(), role: 'assistant', text: openingMessage(segment) },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotaText, setQuotaText] = useState('H5 优先尝试云端 Agent；不可用时使用本地资料回答');

  async function ask(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || loading) {
      return;
    }
    if (trimmed.length > 120) {
      setMessages((current) => [
        ...current,
        { id: messageId(), role: 'assistant', text: '问题最多 120 字。你可以拆成两个问题分别问。' },
      ]);
      return;
    }

    setQuestion('');
    setLoading(true);
    setMessages((current) => [...current, { id: messageId(), role: 'user', text: trimmed }]);

    const result = await askGuide({ question: trimmed, segmentId: segment?.id });
    setQuotaText(result.quotaText);
    setMessages((current) => [
      ...current,
      {
        id: messageId(),
        role: 'assistant',
        text: result.answer,
        sourceLabel: result.fromFallback ? `${result.sourceLabel} · 未调用模型` : result.sourceLabel,
      },
    ]);
    setLoading(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <main className="page with-nav ask-page">
      <section className="section panel ask-hero">
        <div className="card-meta">AI 看展助手</div>
        <h1>问问古蜀助手</h1>
        <p>
          {segment
            ? `正在问：${segment.title}`
            : '可以询问展线、看展顺序、展品看点和古蜀文明线索。'}
        </p>
        <p className="fineprint">{quotaText}</p>
      </section>

      <section className="quick-list" aria-label="快捷问题">
        {questions.map((entry) => (
          <button className="quick-chip" key={entry} type="button" onClick={() => void ask(entry)}>
            {entry}
          </button>
        ))}
      </section>

      <section className="chat-list" aria-live="polite">
        {messages.map((message) => (
          <article className={`message ${message.role}`} key={message.id}>
            <div className="message-text">
              {message.sourceLabel ? <div className="message-source">{message.sourceLabel}</div> : null}
              {renderMessage(message.text)}
            </div>
          </article>
        ))}
        {loading ? (
          <article className="message assistant">
            <div className="message-text">
              <p>正在根据展览资料整理回答...</p>
            </div>
          </article>
        ) : null}
      </section>

      <form className="ask-box" onSubmit={submit}>
        <textarea
          className="question-input"
          maxLength={120}
          placeholder="问一个和当前展品有关的问题，最多 120 字"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <button className="button primary ask-button" disabled={loading} type="submit">
          提问
        </button>
      </form>

      <section className="section legal-note">
        回答由 AI 或 H5 本地资料生成，重要信息请以现场展陈和官方来源为准。
        {segment ? (
          <div className="action-row compact">
            <LinkButton to={`/sanxingdui/segments/${segment.id}`} className="button secondary">
              返回展品详情
            </LinkButton>
          </div>
        ) : null}
      </section>
      <BottomNav />
    </main>
  );
}
