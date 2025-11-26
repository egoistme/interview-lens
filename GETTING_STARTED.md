# 快速上手指南

## 第一步：安装依赖

```bash
cd agent-learning-fullstack
pnpm install
```

这会安装所有 workspace 包的依赖。

## 第二步：配置环境变量

### API 后端配置

```bash
cd apps/api
cp .env.example .env
```

编辑 `apps/api/.env` 文件，添加你的 OpenAI API Key：

```env
PORT=3001
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
NODE_ENV=development
```

### Web 前端配置

```bash
cd apps/web
cp .env.local.example .env.local
```

`apps/web/.env.local` 默认配置：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 第三步：启动开发服务器

从项目根目录运行：

```bash
# 同时启动 Web 和 API 服务
pnpm dev
```

或者分别启动：

```bash
# 终端 1 - 启动 API 服务
pnpm --filter api dev

# 终端 2 - 启动 Web 服务
pnpm --filter web dev
```

启动后：
- **前端**: http://localhost:3000
- **后端**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

## 第四步：测试应用

1. 打开浏览器访问 http://localhost:3000
2. 在聊天界面输入消息
3. AI Agent 会通过 LangGraph 处理并返回响应

## 项目结构说明

```
agent-learning-fullstack/
├── apps/
│   ├── web/                    # Next.js 前端
│   │   ├── src/app/
│   │   │   ├── page.tsx        # 聊天界面主页
│   │   │   ├── layout.tsx      # 根布局
│   │   │   └── globals.css     # 全局样式
│   │   └── package.json
│   │
│   └── api/                    # Express 后端
│       ├── src/
│       │   ├── index.ts        # Express 服务器
│       │   └── agent.ts        # LangGraph Agent 逻辑
│       └── package.json
│
└── packages/
    ├── shared-types/           # 共享类型定义
    │   └── src/index.ts        # Zod Schemas
    ├── ui/                     # UI 组件库
    │   └── src/Button.tsx
    ├── eslint-config/          # ESLint 配置
    └── ts-config/              # TypeScript 配置
```

## 常见问题

### Q: pnpm install 失败？
确保安装了 pnpm >= 8.0.0：
```bash
npm install -g pnpm@latest
```

### Q: API 启动失败？
检查：
1. 是否配置了 `OPENAI_API_KEY`
2. 端口 3001 是否被占用
3. 运行 `pnpm --filter api dev` 查看详细错误

### Q: 前端无法连接后端？
确保：
1. API 服务已启动（http://localhost:3001/health 返回 200）
2. `.env.local` 中 `NEXT_PUBLIC_API_URL` 配置正确

### Q: 类型错误？
运行构建命令生成类型定义：
```bash
pnpm --filter shared-types build
```

## 下一步

- 📖 查看 [README.md](./README.md) 了解项目详情
- 🔧 修改 `apps/api/src/agent.ts` 自定义 Agent 行为
- 🎨 在 `packages/ui/src/` 添加新的 UI 组件
- 📝 在 `packages/shared-types/src/` 添加新的类型定义

## 开发技巧

### 监控文件变化
所有服务都支持热重载：
- Web: Next.js 自动刷新
- API: tsx watch 模式
- Packages: tsc --watch

### 并行构建
Turborepo 会自动并行构建和缓存：
```bash
pnpm build  # 智能并行构建所有包
```

### 代码检查
```bash
pnpm lint      # 检查所有项目
pnpm format    # 格式化代码
```

## 生产部署

### 构建
```bash
pnpm build
```

### 启动生产服务器
```bash
# API
cd apps/api
pnpm start

# Web
cd apps/web
pnpm start
```

建议使用 PM2 或 Docker 进行生产部署。
