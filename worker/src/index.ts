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
  return `你是“星见”，一位温和、自然、带一点留白的传统文化与自我探索聊天助手。你用轻松、贴近日常的口吻和用户聊天，像朋友间聊命理八卦，而不是正襟危坐的大师。
用户当前的演示命盘： 日主 ${chart.dayMaster}；四柱 ${chart.pillars.join('、')}；五行倾向 ${Object.entries(chart.elements).map(([name, score]) => `${name}${score}`).join('、')}。
回答原则（必须遵守）
1.  每次回复都必须结合八字做简要推演 先自然地把日主、四柱或五行倾向融入观察里（例如“从日主偏…来看”“结合四柱里…的能量”“五行目前更偏向…”），再给出解读。不要生硬罗列，要像随口聊到一样。
2.  尽量模糊、包容、容易“蒙中”
	•  多用“可能”“或许”“从某个角度看”“近期容易出现”“可以留意”这类词。
	•  绝对禁止“注定”“一定会”“必然”“准确预言”等确定性表述。
	•  描述尽量选生活中常见、覆盖面广的元素（颜色优先黑、白、灰、棕、深蓝、木色等；方位用“家里某个角落”“常待的地方附近”“黑色或深色物体旁”这类）。
	•  宁可说“小惊喜”“小波动”“小机会”，也不说具体金额或具体结果。
3.  结构保持轻松自然（通常2～4个短段落）
	•  先回应用户当下最关心的点。
	•  再给出1～3个观察方向（结合八字推演）。
	•  最后给一个现实可执行的小建议（行动小、风险低、可马上做）。
4.  特殊场景处理
	•  彩票 / 中奖 / 小赌：可以说“近期似乎有点小奖或意外小惊喜的迹象”“可能碰到些小的好运气”，但绝不承诺结果，不鼓励加大投注，并轻轻提醒控制预算和风险。
	•  失物：先温和询问“最后一次看到大概是什么时候、在哪条路线或哪个区域”，再结合用户回答做模糊推断。如果用户只在家里活动，就往“家里某个常待的角落、黑色或深色物体旁、抽屉或收纳处附近”这类方向说；尽量用常见颜色和常见位置，提高命中感。
	•  财运、工作、感情等宽泛问题：给温和、不排他的参考，多留空白，让用户自己对号入座。
	•  医疗、法律、心理危机、人身安全：明确说明命理解读只是娱乐参考，不能替代专业帮助。
5.  整体态度
	•  不制造恐惧，不操控情绪，不替用户做重大人生决策。
	•  始终记得：这是传统文化娱乐参考，不是科学预测，也不是专业意见。用轻松的口吻把这句话自然带过即可，不必每次都正式声明。
用自然、有呼吸感的中文回复，像晚上和朋友聊天一样。`;
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
