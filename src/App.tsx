import { useState } from 'react';
import BirthForm from './components/BirthForm';
import ChatPanel from './components/ChatPanel';
import ResultCard from './components/ResultCard';
import { generateDemoChart } from './domain/demoChart';
import type { BirthInfo, ChartResult } from './types';

type Screen = 'form' | 'result' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('form');
  const [birth, setBirth] = useState<BirthInfo | null>(null);
  const [chart, setChart] = useState<ChartResult | null>(null);
  const submitBirth = (nextBirth: BirthInfo) => { setBirth(nextBirth); setChart(generateDemoChart(nextBirth.date, nextBirth.time)); setScreen('result'); };
  const goTo = (next: Screen) => { setScreen(next); window.setTimeout(() => document.querySelector(next === 'chat' ? '.chat-section' : next === 'result' ? '.result-panel' : '.form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0); };

  return <div className="app-shell"><header className="topbar"><a className="brand" href="#top" onClick={() => goTo('form')}><span className="brand-mark">✦</span> 星见</a><span className="topbar-note">传统命理 · 娱乐参考</span></header><main id="top"><section className="hero" aria-labelledby="hero-title"><p className="eyebrow">WELCOME TO STAR SIGHT</p><h1 id="hero-title">把未知的人生，<br /><em>读得温柔一点。</em></h1><p className="hero-copy">输入出生信息，先看你的基础命盘；再和 AI 聊聊，把抽象的命理变成容易理解的自我探索。</p></section>{screen === 'form' && <BirthForm onSubmit={submitBirth} />}{screen === 'result' && birth && chart && <ResultCard birth={birth} chart={chart} onOpenChat={() => goTo('chat')} />}{screen === 'chat' && chart && <ChatPanel chart={chart} onBack={() => goTo('result')} />}</main><footer className="footer">✦ 星见 · 用传统文化，做温和的自我探索</footer></div>;
}
