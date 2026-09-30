# 星见 · 算命网站第一版

这是一个 React + TypeScript + Vite 的移动端优先静态网站，可以编译后部署到 GitHub Pages。

## 当前功能

- 出生日期、时间、性别和出生地表单
- 演示版基础排盘结果
- 五行倾向展示
- 点击“生成 AI 解读”进入聊天界面
- 本地模拟 AI 回复
- 聊天次数限制（12 条）
- 手机端响应式布局

## 运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

构建产物在 `dist/`，可直接部署到 GitHub Pages。

## GitHub Pages

## 代码结构

```text
src/
├─ components/       # 表单、结果卡片、聊天界面
├─ domain/           # 排盘领域逻辑
├─ services/         # AI 调用等外部服务
├─ types.ts          # 全局类型
└─ App.tsx           # 页面状态和流程
```

## 后续接入 AI

当前 `src/services/chatService.ts` 是本地模拟回复。正式接入大模型时，只需要替换这个 service，并通过 Cloudflare Worker 等 Serverless 代理保护 API Key，聊天组件不需要重写。

另外，`src/domain/demoChart.ts` 只是演示数据，正式版本需要替换为可靠的节气、干支、时区和真太阳时计算逻辑。
