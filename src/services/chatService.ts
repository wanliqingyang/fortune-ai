import type { ChartResult, ChatMessage } from '../types';

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL?.trim()
  || 'https://cool-wood-8985.paint-behavior.workers.dev/chat';

export const isRemoteChatConfigured = Boolean(chatApiUrl);

/** 后续接入 API 时，只需要替换这个 service，不需要改聊天组件。 */
export function getLocalAssistantReply(question: string, chart: ChartResult): string {
  const lower = question.toLowerCase();
  if (lower.includes('工作') || lower.includes('事业')) {
    return `从你的${chart.dayMaster}演示命盘看，更适合先把目标拆小、积累可见成果，再考虑主动切换环境。真正决定工作选择的，还是你的能力、资源和现实机会。`;
  }
  if (lower.includes('感情') || lower.includes('恋爱')) {
    return '命理更适合作为观察自己的语言。你可以留意自己在关系里是否习惯先照顾对方，再表达需要；清晰沟通会比等待“注定的答案”更有帮助。';
  }
  if (lower.includes('财') || lower.includes('钱')) {
    return '这部分只做文化角度的参考：先建立稳定的预算和风险边界，再谈机会。任何投资决定都应该基于可靠信息和自己的承受能力。';
  }
  return '我会结合你的基础命盘，用传统命理的角度陪你梳理。你可以继续问工作、关系、近期状态，或直接告诉我最近最困扰你的事情。';
}

/**
 * 生产环境通过 Cloudflare Worker 调用模型。未配置 Worker 地址时保留本地演示，
 * 这样 GitHub Pages 在后端尚未发布时仍然可以正常预览。
 */
export async function getAssistantReply(
  messages: ChatMessage[],
  chart: ChartResult,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const latestQuestion = messages[messages.length - 1]?.content ?? '';
  if (!chatApiUrl) return getLocalAssistantReply(latestQuestion, chart);

  let response: Response;
  try {
    response = await fetch(chatApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart,
        messages: messages.slice(-8).map(({ role, content }) => ({ role, content })),
      }),
    });
  } catch {
    throw new Error('AI 服务暂时无法连接，请稍后再试。');
  }
  if (response.headers.get('content-type')?.includes('text/event-stream') && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';

    const consume = (chunk: string) => {
      buffer += chunk;
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const event of events) {
        for (const line of event.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta) {
              content += delta;
              onDelta?.(delta);
            }
          } catch {
            // Ignore incomplete or provider-specific SSE frames.
          }
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      consume(decoder.decode(value, { stream: true }));
    }
    consume(decoder.decode());
    if (!content.trim()) throw new Error('AI 服务没有返回有效内容。');
    return content.trim();
  }

  const data = await response.json().catch(() => null) as { content?: string; error?: string } | null;
  if (!response.ok || !data?.content) throw new Error(data?.error ?? 'AI 服务暂时不可用，请稍后再试。');
  return data.content;
}
