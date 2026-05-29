import { apiClient } from '../api/client';
import { content, GuideTip, Segment } from '../data/content';
import { getSegment, resolveTheme } from './paths';

export type AskContext = {
  segmentId?: number;
  question: string;
};

export type AskResult = {
  answer: string;
  quotaText: string;
  fromFallback: boolean;
  sourceLabel: string;
};

const generalQuestions = [
  '我只有30分钟，应该怎么看？',
  '这个展览最重要的线索是什么？',
  '第一次看，先抓哪条主线？',
];

const segmentQuestions = [
  '先看它的哪个细节？',
  '它为什么值得停下来？',
  '它接到哪条古蜀主线？',
  '哪些说法不能说死？',
];

export function quickQuestions(segment?: Segment): string[] {
  return segment ? segmentQuestions : generalQuestions;
}

export function openingMessage(segment?: Segment): string {
  if (segment) {
    return `你正在问「${segment.title}」。我会优先围绕这件展品，把可见细节、重要性和古蜀线索讲清楚。`;
  }
  return '我会像现场导览员一样，围绕展线、看展顺序、展品看点和古蜀文明线索来回答。';
}

function segmentContext(segment?: Segment) {
  if (!segment) {
    return null;
  }
  return {
    id: segment.id,
    title: segment.title,
    artifactsText: segment.artifactsText,
    description: segment.description,
    viewingGuide: segment.viewingGuide,
    guideScript: segment.guideScript,
    guideTips: segment.guideTips || [],
  };
}

function firstTip(segment: Segment, labels: string[]): GuideTip | undefined {
  return (segment.guideTips || []).find((tip) => labels.some((label) => tip.label.includes(label)));
}

function localSegmentAnswer(question: string, segment: Segment): string {
  const lookTip = firstTip(segment, ['看这里', '看']);
  const compareTip = firstTip(segment, ['可以对比', '对比', '想一想', '传说']);
  const guide = segment.viewingGuide || segment.guideScript;
  const theme = resolveTheme(segment.id);

  if (/不能|说死|定论|推测|依据/.test(question)) {
    return [
      `这件展品可以先按「${theme}」这条线索理解，但不要把解释说成唯一结论。`,
      guide,
      compareTip ? `需要分清的是：${compareTip.text}` : '更稳妥的说法，是先描述可见造型、材质和展陈关系，再谈它可能指向的仪式或身份含义。',
    ].join('\n\n');
  }

  if (/为什么|值得|重要/.test(question)) {
    return [
      `它值得停下来，是因为它把「${segment.artifactsText || segment.artifacts.join('、')}」接到了古蜀文明的主题线索里。`,
      guide,
      compareTip ? `再往外看：${compareTip.text}` : `可以把它放回「${theme}」主题中，观察它和前后展品怎样互相说明。`,
    ].join('\n\n');
  }

  if (/细节|先看|看哪/.test(question)) {
    return [
      lookTip ? `先看这个细节：${lookTip.text}` : `先看它的造型、材质、纹样和展柜里的摆放关系。`,
      guide,
      compareTip ? `看完后可以对比：${compareTip.text}` : '看完单件后，再回到它所在主题，理解它为什么被放在这条展线里。',
    ].join('\n\n');
  }

  return [
    `可以先把它放在「${theme}」里看。`,
    guide,
    lookTip ? `站在展柜前，先抓这个观察点：${lookTip.text}` : '',
    compareTip ? `再补一层关系：${compareTip.text}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function localGeneralAnswer(question: string): string {
  const themes = content.guide.prologueThemes;

  if (/30分钟|半小时|路线|怎么看|顺序/.test(question)) {
    return [
      '如果只有 30 分钟，建议不要平均用力。',
      `先用 5 分钟建立展览总问题：${content.guide.curatorialGoal}`,
      `再按「${themes[0].title}」看发现与震撼器物，接着进「${themes[1].title}」看人像、面具和神坛，最后用「${themes[2].title}」或「${themes[3].title}」收束信仰与交流线索。`,
      '每段只抓一个可见细节和一个问题，不必把所有展品都看完。',
    ].join('\n\n');
  }

  if (/主线|线索|重要/.test(question)) {
    return [
      `这场展览最重要的线索，是把三星堆与金沙放在同一个古蜀文明脉络里看。`,
      ...themes.map((theme) => `**${theme.title}**：${theme.goal}`),
      '看展时可以不断追问：这件器物是在讲身份、祭祀、宇宙想象，还是文明交流？',
    ].join('\n\n');
  }

  return [
    `可以先从展览主题入手：${content.guide.exhibition}。`,
    content.guide.curatorialGoal,
    `首轮浏览建议抓四条线：${themes.map((theme) => theme.title).join('、')}。如果你已经站在某件展品前，可以进详情页点“问这件展品”，回答会更贴近展柜现场。`,
  ].join('\n\n');
}

function localAnswer(question: string, segment?: Segment): string {
  return segment ? localSegmentAnswer(question, segment) : localGeneralAnswer(question);
}

export async function askGuide({ question, segmentId }: AskContext): Promise<AskResult> {
  const segment = segmentId ? getSegment(segmentId) : undefined;
  const payload = {
    action: 'ask',
    question,
    segmentId: segment?.id || 0,
    contextMode: segment ? 'segment' : 'general',
    segmentContext: segmentContext(segment),
    guideContext: {
      exhibition: content.guide.exhibition,
      venue: content.guide.venue,
      curatorialGoal: content.guide.curatorialGoal,
      themes: content.guide.prologueThemes,
    },
  };

  try {
    const response = await apiClient.post('/museum/ask-guide', payload);
    const data = response.data?.data || response.data;
    if (data?.answer) {
      return {
        answer: data.answer,
        quotaText:
          typeof data.remaining === 'number' && typeof data.dailyLimit === 'number'
            ? `云端 Agent 已连接 · 今日剩余 ${data.remaining}/${data.dailyLimit} 次`
            : 'AI 服务已连接',
        fromFallback: false,
        sourceLabel: '云端 Agent',
      };
    }
  } catch (error) {
    const reason =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message || '请求失败')
        : '请求失败';
    // Static H5 fallback keeps the feature usable before the server-side agent is exposed.
    return {
      answer: localAnswer(question, segment),
      quotaText: `未调用模型，已切换 H5 本地资料回答：${reason}`,
      fromFallback: true,
      sourceLabel: 'H5 本地资料',
    };
  }

  return {
    answer: localAnswer(question, segment),
    quotaText: '未调用模型，已切换 H5 本地资料回答：Agent API 未返回 answer',
    fromFallback: true,
    sourceLabel: 'H5 本地资料',
  };
}
