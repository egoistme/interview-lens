# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InterviewLens 是一个 AI 驱动的面试录音分析工具，将面试录音转化为可操作的洞察报告。

## Commands

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (Web: 3000, API: 3001)
pnpm dev

# 构建所有包
pnpm build

# 代码检查
pnpm lint

# 格式化代码
pnpm format

# 清理构建产物
pnpm clean

# 单独运行某个 app
pnpm --filter @interview-lens/api dev
pnpm --filter @interview-lens/web dev

# 单独构建某个包
pnpm --filter @interview-lens/shared-types build
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/
├── web/          # Next.js 14 前端 (App Router, Tailwind CSS)
└── api/          # Express 后端 (LangChain + 智谱 GLM)

packages/
├── shared-types/ # 共享 Zod schemas 和 TypeScript 类型
├── ui/           # 共享 React 组件
├── eslint-config/
└── ts-config/
```

### Data Flow

1. **Frontend** (`apps/web/src/app/page.tsx`) 通过 `NEXT_PUBLIC_API_URL` 调用后端
2. **Backend** (`apps/api/src/index.ts`) 接收请求，使用 Zod schema 验证
3. **Agent** (`apps/api/src/agent.ts`) 使用 LangChain + 智谱 GLM 处理消息
4. **Shared Types** (`packages/shared-types`) 提供前后端共享的类型定义

### Key Patterns

- **工厂模式创建 Agent**: `createAgent(config)` 接收配置参数，返回 agent 实例
- **Zod Schema 验证**: 所有 API 请求/响应使用 `ChatRequestSchema`/`ChatResponseSchema` 验证
- **环境变量**: API 端在入口文件顶部加载 dotenv，启动时验证必要配置

## Environment Variables

### API (`apps/api/.env`)
```
ZHIPUAI_API_KEY=xxx     # 必需 - 智谱 AI API Key
ZHIPUAI_MODEL=glm-4-flash  # 可选 - 模型选择
PORT=3001               # 可选
```

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## API Endpoints

- `GET /health` - 健康检查
- `POST /api/chat` - 发送消息 `{ message: string, conversationId?: string }`
- `POST /api/chat/stream` - SSE 流式响应 (待完善)

## Git Commit Rules

- 提交信息使用中文
- 不要添加 Claude 署名（不要添加 `Co-Authored-By: Claude` 或 `Generated with Claude Code`）
