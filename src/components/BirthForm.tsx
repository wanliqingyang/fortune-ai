import { useState, type FormEvent } from 'react';
import type { BirthInfo, Gender } from '../types';

interface BirthFormProps { onSubmit: (birth: BirthInfo) => void; }

export default function BirthForm({ onSubmit }: BirthFormProps) {
  const [birth, setBirth] = useState<BirthInfo>({ date: '1998-08-18', time: '09:30', gender: '女', place: '北京' });
  const update = (key: keyof BirthInfo, value: string) => setBirth((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(birth); };

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="section-heading"><div><span className="step-label">01</span><h2 id="form-title">填写出生信息</h2></div><span className="time-note">约 1 分钟</span></div>
      <form onSubmit={submit}>
        <div className="field-grid"><label className="field"><span>出生日期</span><input type="date" required value={birth.date} onChange={(event) => update('date', event.target.value)} /></label><label className="field"><span>出生时间</span><input type="time" required value={birth.time} onChange={(event) => update('time', event.target.value)} /></label></div>
        <div className="field-grid"><label className="field"><span>性别</span><select value={birth.gender} onChange={(event) => update('gender', event.target.value as Gender)}><option value="女">女</option><option value="男">男</option><option value="其他">其他</option></select></label><label className="field"><span>出生地</span><input type="text" value={birth.place} onChange={(event) => update('place', event.target.value)} /></label></div>
        <button className="primary-button" type="submit">开始排盘 <span aria-hidden="true">→</span></button>
      </form>
      <p className="privacy-note">信息只保存在当前浏览器，不会上传。正式接入 AI 前，我们会再补充隐私说明。</p>
    </section>
  );
}
