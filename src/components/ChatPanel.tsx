import { useState, type FormEvent } from 'react';
import type { ChartResult, ChatMessage } from '../types';
import { getLocalAssistantReply } from '../services/chatService';

interface ChatPanelProps { chart: ChartResult; onBack: () => void; }
const MAX_MESSAGES = 12;

export default function ChatPanel({ chart, onBack }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: '你好，我已经看到你的基础命盘了。你可以问我工作、感情、财运，或者直接聊聊最近的状态。\n\n先提醒一下：这里是传统文化视角的自我探索，不是确定性的预言。' }]);
  const [input, setInput] = useState('');
  const [remaining, setRemaining] = useState(MAX_MESSAGES);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || remaining <= 0) return;
    setInput('');
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: question }]);
    setRemaining((current) => current - 1);
    window.setTimeout(() => setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: getLocalAssistantReply(question, chart) }]), 350);
  };

  return (
    <section className="chat-section" aria-labelledby="chat-title">
      <div className="chat-header"><button className="icon-button" type="button" onClick={onBack} aria-label="返回命盘结果">←</button><div><p className="chat-kicker">03 · AI CONVERSATION</p><h2 id="chat-title">和你的命盘聊聊</h2></div><span className="quota">剩余 {remaining} 条</span></div>
      <div className="chat-messages" aria-live="polite">{messages.map((message) => <div className={`message ${message.role}`} key={message.id}><div className="avatar" aria-hidden="true">{message.role === 'user' ? '我' : '✦'}</div><div className="bubble">{message.content}</div></div>)}</div>
      <form className="chat-input-wrap" onSubmit={send}><label className="sr-only" htmlFor="chat-input">输入你的问题</label><textarea id="chat-input" rows={1} maxLength={300} value={input} disabled={remaining <= 0} onChange={(event) => setInput(event.target.value)} placeholder={remaining > 0 ? '例如：我最近适合换工作吗？' : '本次演示次数已用完'} /><button className="send-button" type="submit" aria-label="发送消息" disabled={remaining <= 0}>↑</button></form>
      <p className="chat-hint">演示版使用本地模拟回复；后续可在这里接入大模型 API。</p>
    </section>
  );
}
