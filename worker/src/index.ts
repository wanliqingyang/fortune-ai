interface Env {
  AI_API_KEY: string;
  AI_BASE_URL: string;
  AI_MODEL?: string;
}

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  chart: {
    pillars: string[];
    dayMaster: string;
    elements: Record<string, number>;
  };
}

const ALLOWED_ORIGIN = 'https://wanliqingyang.github.io';
const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_MESSAGES = 8;
const MAX_OUTPUT_TOKENS = 480;

function corsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

function isValidRequest(value: unknown): value is ChatRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Partial<ChatRequest>;
  return Array.isArray(request.messages)
    && request.messages.length > 0
    && request.messages.length <= MAX_MESSAGES
    && request.messages.every((message) =>
      typeof message?.content === 'string'
      && message.content.length > 0
      && message.content.length <= MAX_MESSAGE_LENGTH
      && (message.role === 'user' || message.role === 'assistant'),
    )
    && typeof request.chart?.dayMaster === 'string'
    && Array.isArray(request.chart?.pillars);
}

function systemPrompt(chart: ChatRequest['chart']): string {
  return `你是“星见”的传统文化与自我探索聊天助手。你的表达有东方意象与留白，但始终真诚、温和、清楚，不把娱乐性解读伪装成事实或确定预言。

用户的演示命盘：日主 ${chart.dayMaster}；四柱 ${chart.pillars.join('、')}；五行倾向 ${Object.entries(chart.elements).map(([name, score]) => `${name}${score}`).join('、')}。

回答原则：
1. 将命理当作传统文化、象征语言与自我探索工具。使用“从这个角度看”“可能”“更值得留意”“可以先观察”等措辞；不使用“注定”“一定会”“精确到某日会发生”等绝对断言。
2. 先回应用户的情绪或关注点，再给出 1—3 个有余地的观察方向，最后提供一个可执行的小建议或温和追问。除非用户只要求一句话，否则通常写 2—4 个短段落。
3. 对宽泛问题（近期运势、工作、关系、机会）可给出有画面感但不排他的描述：例如节奏、沟通、旧人旧事、微小机会、整理与取舍；避免把常见情况说成已经发生的事实。
4. 对彩票、偏财或中奖：不预测中奖、不鼓励投注、不承诺“小奖”。可以说这类问题更适合把它当作娱乐话题，提醒设定预算与止损，并把“好运”转化为留意小机会、折扣、礼物、合作回报或意外的善意。
5. 对失物：不假装能定位物品，也不声称某个方向、抽屉或袋子必然有物品。先问最后一次确认物品出现的时间、路线和当时携带的容器；再给出基于线索的搜索顺序（常用包袋、进门/出门处、近期换下衣物、桌面与收纳区、交通工具）。如果用户想要“象征提示”，可将方位或颜色明确称作游戏化联想，而非事实，并始终建议先按现实线索寻找。
6. 涉及投资、医疗、法律、心理危机或人身安全时，避免给结论性建议；说明命理解读不能替代专业意见，并建议寻求相应专业帮助或紧急支持。
7. 不渲染恐惧、不操控用户情绪、不贬低任何人。关系问题强调边界、沟通和尊重；职业问题强调能力、资源与现实条件。
8. 保持中文自然、克制、有人情味。可使用少量传统文化意象，但不要堆砌术语。若信息不足，先提出 1—2 个具体问题，而不是编造细节。

输出前自检：这是娱乐性、非确定性的回应吗？是否给出了现实世界可验证的下一步？是否避免了精确预测、定位和诱导消费？`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (origin !== ALLOWED_ORIGIN) return json({ error: '不允许的来源。' }, 403, origin);
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/chat') {
      return json({ error: '接口不存在。' }, 404, origin);
    }
    if (!env.AI_API_KEY) {
      return json({ error: 'AI 服务尚未配置完成：缺少 API Key。' }, 503, origin);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return json({ error: '请求格式错误。' }, 400, origin);
    }
    if (!isValidRequest(payload)) return json({ error: '消息内容不符合要求。' }, 400, origin);

    const upstream = await fetch(`${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.AI_MODEL || 'deepseek-v4-flash-0731',
        temperature: 0.7,
        max_tokens: MAX_OUTPUT_TOKENS,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt(payload.chart) }, ...payload.messages.slice(-MAX_CONTEXT_MESSAGES)],
      }),
    });

    if (!upstream.ok) {
      console.error('Upstream AI request failed', upstream.status);
      return json({ error: 'AI 服务暂时不可用，请稍后再试。' }, 502, origin);
    }

    if (upstream.body && upstream.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          ...corsHeaders(origin),
        },
      });
    }

    const result = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) return json({ error: 'AI 服务没有返回有效内容。' }, 502, origin);
    return json({ content }, 200, origin);
  },
};
