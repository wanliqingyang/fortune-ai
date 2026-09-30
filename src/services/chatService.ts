import type { ChartResult } from '../types';

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
