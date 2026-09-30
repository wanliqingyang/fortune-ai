import type { BirthInfo, ChartResult, ElementName } from '../types';

interface ResultCardProps { birth: BirthInfo; chart: ChartResult; onOpenChat: () => void; }
const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
const elementNames: ElementName[] = ['木', '火', '土', '金', '水'];

export default function ResultCard({ birth, chart, onOpenChat }: ResultCardProps) {
  return (
    <section className="panel result-panel" aria-labelledby="result-title">
      <div className="section-heading"><div><span className="step-label">02</span><h2 id="result-title">你的基础命盘</h2></div><span className="status-pill">演示结果</span></div>
      <p className="result-summary">{birth.date} {birth.time} · {birth.place || '出生地未填写'} · 日主为{chart.dayMaster}</p>
      <div className="pillars" aria-label="四柱八字">{chart.pillars.map((pillar, index) => <div className="pillar" key={pillarNames[index]}><small>{pillarNames[index]}</small><strong>{pillar}</strong></div>)}</div>
      <div className="element-block"><div className="mini-heading"><span>五行倾向</span><span className="muted">基础统计</span></div><div className="element-bars">{elementNames.map((name) => <div className="element-row" key={name}><span>{name}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${chart.elements[name]}%` }} /></div><span>{chart.elements[name]}</span></div>)}</div></div>
      <button className="primary-button chat-button" type="button" onClick={onOpenChat}>生成 AI 解读 <span aria-hidden="true">✦</span></button>
      <p className="disclaimer">命理属于传统文化表达，结果仅供娱乐和自我观察，不作为医疗、投资、法律或重大人生决策依据。</p>
    </section>
  );
}
