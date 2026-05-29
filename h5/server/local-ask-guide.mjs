import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, '..');
const envPath = path.resolve(appDir, '.env');
const contentPath = path.resolve(appDir, 'src/data/release-content.json');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv(envPath);

const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
const requiredAccessToken = safeText(process.env.MUSEUM_AGENT_API_TOKEN, 4096);

const DEFAULT_CONFIG = {
  enabled: true,
  provider: process.env.AI_PROVIDER || 'deepseek',
  dailyLimit: Number(process.env.LOCAL_DAILY_LIMIT || 10),
  maxQuestionLength: 120,
  maxContextLength: 1200,
  temperature: 0.2,
  maxTokens: 520,
  providers: {
    deepseek: {
      model: 'deepseek-v4-flash',
      apiBaseUrl: 'https://api.deepseek.com/chat/completions',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
    },
    kimi: {
      model: 'kimi-for-coding',
      apiBaseUrl: 'https://api.kimi.com/coding/v1/chat/completions',
      apiKeyEnv: 'KIMI_API_KEY',
      headers: {
        'User-Agent': 'claude-code/1.0.0',
      },
    },
  },
  systemPrompt:
    '你是“三星堆、金沙古蜀文明展”的现场导览员，正在代替真人导游回答观众看展时的追问。你的回答要像站在展柜前讲解：先抓住观众眼前这件展品，再把它接到古蜀文明的主线。不要把自己说成资料助手，不要输出“给孩子讲”“可以这样讲给孩子听”这类应用说明。回答应具体、克制、有现场感；不得编造来源、年代、展品细节；对推测性内容要明确说“可以理解为”“目前资料显示”“不宜说成定论”。',
};

const DEFAULT_MEMORY_CONFIG = {
  enabled: process.env.MEMORY_ENABLED === '1',
  apiBaseUrl: process.env.MEMORY_API_BASE_URL || '',
  apiKey: process.env.MEMORY_API_KEY || '',
  agentId: process.env.MEMORY_AGENT_ID || 'sanxingdui-guide',
  timeoutMs: Number(process.env.MEMORY_TIMEOUT_MS || 3000),
  topK: Number(process.env.MEMORY_TOP_K || 5),
};

let usedToday = 0;
let usageDate = todayKey();

function todayKey() {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return utc8.toISOString().slice(0, 10);
}

function resetUsageIfNeeded() {
  const today = todayKey();
  if (usageDate !== today) {
    usageDate = today;
    usedToday = 0;
  }
}

function safeText(value, limit) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function getRequestToken(req) {
  const headerToken = safeText(req.headers['x-museum-agent-token'], 4096);
  if (headerToken) {
    return headerToken;
  }

  const authorization = safeText(req.headers.authorization, 4096);
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? safeText(match[1], 4096) : '';
}

function timingSafeEqualText(left, right) {
  if (!left || !right || left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function isAuthorized(req) {
  if (!requiredAccessToken) {
    return true;
  }

  return timingSafeEqualText(getRequestToken(req), requiredAccessToken);
}

function jsonText(value, limit) {
  return safeText(JSON.stringify(value || {}), limit);
}

function buildContext(event, config) {
  const segment = event.segmentContext || null;
  const guide = event.guideContext || {};
  const parts = [];

  parts.push(
    '展览资料：' +
      jsonText(
        {
          exhibition: guide.exhibition,
          venue: guide.venue,
          curatorialGoal: guide.curatorialGoal,
          themes: guide.themes,
        },
        1000,
      ),
  );

  if (segment) {
    parts.push(
      '当前展品：' +
        jsonText(
          {
            id: segment.id,
            title: segment.title,
            artifactsText: segment.artifactsText,
            description: segment.description,
            viewingGuide: segment.viewingGuide,
            guideScript: segment.guideScript,
            guideTips: segment.guideTips,
          },
          config.maxContextLength,
        ),
    );
  }

  return parts.join('\n').slice(0, config.maxContextLength);
}

function postJson(urlString, body, headers = {}, timeoutMs = 45000) {
  const url = new URL(urlString);
  const payload = JSON.stringify(body);
  const transport = url.protocol === 'https:' ? https : http;
  const options = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname + url.search,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  if (url.protocol === 'https:' && process.env.MEMORY_TLS_REJECT_UNAUTHORIZED === '0') {
    options.rejectUnauthorized = false;
  }

  return new Promise((resolve, reject) => {
    const req = transport.request(options, (res) => {
      let raw = '';

      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          reject(new Error('Response is not valid JSON'));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(parsed.detail || parsed.message || parsed.error?.message || `Request failed with status ${res.statusCode}`));
          return;
        }
        resolve(parsed);
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function queryMemories(question, config) {
  const memoryConfig = config.memory || {};
  if (!memoryConfig.enabled || !memoryConfig.apiBaseUrl || !memoryConfig.apiKey) {
    return [];
  }

  const baseUrl = String(memoryConfig.apiBaseUrl).replace(/\/+$/, '');
  const response = await postJson(
    `${baseUrl}/search`,
    {
      query: question,
      filters: {
        agent_id: memoryConfig.agentId || 'sanxingdui-guide',
      },
      top_k: Number(memoryConfig.topK || 5),
    },
    {
      'X-API-Key': memoryConfig.apiKey,
    },
    Number(memoryConfig.timeoutMs || 3000),
  );

  if (!Array.isArray(response.results)) {
    return [];
  }

  const publicResults = response.results.filter((memory) => !memory.user_id);
  return publicResults.length > 0 ? publicResults : response.results;
}

function buildMemoryContext(memories) {
  if (!memories || memories.length === 0) {
    return '';
  }

  const lines = memories.slice(0, 8).map((memory, index) => {
    const metadata = memory.metadata || {};
    const title = metadata.title || memory.title || `记忆片段 ${index + 1}`;
    const type = metadata.type ? `类型：${metadata.type}；` : '';
    const tags = Array.isArray(metadata.tags) && metadata.tags.length > 0 ? `标签：${metadata.tags.join('、')}；` : '';
    const score = memory.score == null ? '' : `相似度：${Number(memory.score).toFixed(3)}；`;
    const text = safeText(memory.memory || memory.content || '', 650);
    return `${index + 1}. ${title}：${type}${tags}${score}${text}`;
  });

  return `检索到的导览记忆：\n${lines.join('\n')}`;
}

function requestChatCompletion(config, messages) {
  const providerId = process.env.AI_PROVIDER || config.provider || DEFAULT_CONFIG.provider;
  const providerConfig = config.providers?.[providerId] || {};
  const apiKeyEnv = providerConfig.apiKeyEnv || 'AI_API_KEY';
  const apiKey = process.env[apiKeyEnv] || process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || providerConfig.model || config.model;
  const apiBaseUrl = process.env.AI_API_BASE_URL || providerConfig.apiBaseUrl || config.apiBaseUrl;
  const extraHeaders = providerConfig.headers || {};

  if (!apiKey) {
    throw new Error(`${apiKeyEnv} is not configured`);
  }
  if (!apiBaseUrl) {
    throw new Error('AI_API_BASE_URL is not configured');
  }
  if (!model) {
    throw new Error('AI_MODEL is not configured');
  }

  return postJson(
    apiBaseUrl,
    {
      model,
      messages,
      temperature: Number(config.temperature == null ? 0.2 : config.temperature),
      max_tokens: Number(config.maxTokens || 420),
    },
    {
      ...extraHeaders,
      Authorization: `Bearer ${apiKey}`,
    },
    45000,
  );
}

function buildMessages(event, config, memoryContext) {
  const context = buildContext(event, config);
  const isSegmentQuestion = event.contextMode === 'segment' && event.segmentContext;
  const userContentParts = [];

  if (memoryContext) {
    userContentParts.push(memoryContext);
  }

  if (isSegmentQuestion) {
    userContentParts.push(
      '当前正在看的展品：' +
        jsonText(
          {
            id: event.segmentContext.id,
            title: event.segmentContext.title,
            artifactsText: event.segmentContext.artifactsText,
            viewingGuide: event.segmentContext.viewingGuide,
            guideTips: event.segmentContext.guideTips,
          },
          config.maxContextLength,
        ),
    );
  }

  userContentParts.push(`小程序内置展览资料：\n${context}`);
  userContentParts.push(`观众问题：${safeText(event.question, config.maxQuestionLength)}`);

  return [
    {
      role: 'system',
      content:
        `${config.systemPrompt || DEFAULT_CONFIG.systemPrompt}\n` +
        '回答约束：1. 优先综合“检索到的导览记忆”，其次参考“小程序内置展览资料”。2. 如果提供了“当前正在看的展品”，必须围绕该展品回答，至少点出一个可见细节、一个重要性判断、一个与三星堆/金沙/古蜀文明的关联。3. 用户问路线或展览重点时，给出可执行观察顺序；用户问展品时，给出展柜前能立刻看的细节。4. 对不确定内容要明确说“不宜说成定论”。5. 回答控制在120到260字，必要时使用 Markdown 短列表、加粗关键词或行内代码，不要输出复杂表格。',
    },
    { role: 'user', content: userContentParts.join('\n\n') },
  ];
}

async function handleAskGuide(event) {
  resetUsageIfNeeded();

  const config = {
    ...DEFAULT_CONFIG,
    memory: DEFAULT_MEMORY_CONFIG,
  };
  const remaining = Math.max(config.dailyLimit - usedToday, 0);

  if (event.action === 'quota') {
    return {
      enabled: config.enabled,
      dailyLimit: config.dailyLimit,
      used: usedToday,
      remaining,
    };
  }

  if (remaining <= 0) {
    const error = new Error('今日提问次数已用完');
    error.statusCode = 429;
    error.data = { dailyLimit: config.dailyLimit, used: usedToday, remaining: 0 };
    throw error;
  }

  const question = safeText(event.question, config.maxQuestionLength);
  if (!question) {
    const error = new Error('问题不能为空');
    error.statusCode = 400;
    throw error;
  }

  let memoryContext = '';
  try {
    const memories = await queryMemories(question, config);
    memoryContext = buildMemoryContext(memories);
  } catch (err) {
    console.warn('[local-ask-guide] memory search fallback:', err.message);
  }

  const messages = buildMessages({ ...event, question }, config, memoryContext);
  const completion = await requestChatCompletion(config, messages);
  const answer = safeText(completion.choices?.[0]?.message?.content, 1200);
  usedToday += 1;

  return {
    answer:
      answer ||
      '当前资料不足以确认，但可以先从展品的造型、材质和它与三星堆或金沙主线的关系继续观察。',
    enabled: config.enabled,
    dailyLimit: config.dailyLimit,
    used: usedToday,
    remaining: Math.max(config.dailyLimit - usedToday, 0),
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Request body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Museum-Agent-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/v1/museum/ask-guide') {
    sendJson(res, 404, { code: 404, message: 'Not found' });
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { code: 401, message: 'Unauthorized' });
    return;
  }

  try {
    const payload = await readJson(req);
    const data = await handleAskGuide(payload);
    sendJson(res, 200, { code: 200, data });
  } catch (err) {
    const statusCode = err.statusCode || 502;
    const expose = process.env.DEBUG_AI_ERRORS === '1';
    sendJson(res, statusCode, {
      code: statusCode,
      message: expose ? err.message : statusCode === 429 ? err.message : 'AI 服务暂时不可用，请稍后重试',
      data: err.data,
    });
  }
});

const port = Number(process.env.LOCAL_ASK_GUIDE_PORT || 8787);
server.listen(port, '127.0.0.1', () => {
  console.log(`[local-ask-guide] listening on http://127.0.0.1:${port}/api/v1/museum/ask-guide`);
  console.log(`[local-ask-guide] env file: ${envPath}`);
  console.log(`[local-ask-guide] content: ${content.guide.exhibition}`);
  console.log(`[local-ask-guide] access token: ${requiredAccessToken ? 'enabled' : 'disabled'}`);
});
