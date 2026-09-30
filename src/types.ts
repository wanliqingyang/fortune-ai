export type Gender = '女' | '男' | '其他';

export interface BirthInfo {
  date: string;
  time: string;
  gender: Gender;
  place: string;
}

export type ElementName = '木' | '火' | '土' | '金' | '水';

export interface ChartResult {
  pillars: [string, string, string, string];
  elements: Record<ElementName, number>;
  dayMaster: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
