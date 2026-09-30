import type { ChartResult } from '../types';

const charts: ChartResult[] = [
  { pillars: ['戊寅', '庚申', '甲午', '己巳'], elements: { 木: 68, 火: 84, 土: 46, 金: 38, 水: 27 }, dayMaster: '甲木' },
  { pillars: ['乙亥', '丁卯', '辛酉', '壬辰'], elements: { 木: 82, 火: 40, 土: 31, 金: 72, 水: 58 }, dayMaster: '辛金' },
  { pillars: ['丙子', '己酉', '戊辰', '丙午'], elements: { 木: 24, 火: 79, 土: 76, 金: 61, 水: 42 }, dayMaster: '戊土' },
];

/** 临时演示算法。正式版替换为节气、干支、时区和真太阳时计算。 */
export function generateDemoChart(date: string, time: string): ChartResult {
  const seed = [...`${date}${time}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return charts[seed % charts.length];
}
