# 面试复盘 MVP - 快速启动指南

## 🚀 5分钟快速启动

### 前置要求
- Node.js 20+
- pnpm 8+
- OpenAI API Key

### 一键安装脚本

```bash
#!/bin/bash
# setup.sh - MVP 快速初始化脚本

echo "🚀 开始初始化面试复盘 MVP..."

# 1. 创建项目结构
echo "📁 创建项目目录..."
mkdir -p interview-replay-mvp/{apps/{web,api},packages/shared,uploads,reports,data}
cd interview-replay-mvp

# 2. 初始化 pnpm workspace
echo "📦 初始化 pnpm workspace..."
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 3. 创建根 package.json
cat > package.json << EOF
{
  "name": "interview-replay-mvp",
  "private": true,
  "scripts": {
    "dev": "concurrently \\"pnpm dev:api\\" \\"pnpm dev:web\\"",
    "dev:api": "cd apps/api && pnpm dev",
    "dev:web": "cd apps/web && pnpm dev",
    "build": "pnpm build:api && pnpm build:web",
    "build:api": "cd apps/api && pnpm build",
    "build:web": "cd apps/web && pnpm build",
    "start": "concurrently \\"pnpm start:api\\" \\"pnpm start:web\\"",
    "db:init": "cd apps/api && node scripts/init-db.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
EOF

# 4. 初始化前端
echo "🎨 初始化 Next.js 前端..."
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --yes
pnpm add axios react-dropzone socket.io-client lucide-react

# 5. 初始化后端
echo "⚙️ 初始化 Express 后端..."
cd ../api
pnpm init -y
pnpm add express cors helmet morgan dotenv multer sqlite3 openai socket.io uuid
pnpm add -D @types/express @types/node typescript tsx nodemon

# 6. 创建环境变量模板
echo "🔐 创建环境配置..."
cd ../..
cat > .env.example << EOF
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here

# 应用配置
NODE_ENV=development
PORT=8080

# URL 配置
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF

cp .env.example .env

echo "✅ 项目结构创建完成！"
echo ""
echo "📝 下一步："
echo "1. 编辑 .env 文件，添加你的 OpenAI API Key"
echo "2. 运行 pnpm install 安装依赖"
echo "3. 运行 pnpm db:init 初始化数据库"
echo "4. 运行 pnpm dev 启动开发服务器"
```

### 手动步骤

```bash
# 1. 克隆或创建项目
git clone <repo-url> interview-replay-mvp
cd interview-replay-mvp

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，添加 OPENAI_API_KEY

# 4. 初始化数据库
pnpm db:init

# 5. 启动开发服务器
pnpm dev

# 访问应用
# 前端: http://localhost:3000
# API: http://localhost:8080
```

## 📂 最小项目结构

```
interview-replay-mvp/
├── apps/
│   ├── web/                 # Next.js 前端
│   │   ├── app/
│   │   │   ├── page.tsx     # 主页面
│   │   │   └── api/         # API 路由（可选）
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── AnalysisProgress.tsx
│   │   │   └── ReportView.tsx
│   │   └── package.json
│   │
│   └── api/                 # Express 后端
│       ├── src/
│       │   ├── server.ts    # 主服务器
│       │   ├── routes/      # API 路由
│       │   ├── services/    # 业务逻辑
│       │   └── db/          # 数据库
│       └── package.json
│
├── uploads/                 # 音频文件存储
├── reports/                 # 报告存储
├── data/                    # SQLite 数据库
├── .env                     # 环境变量
├── docker-compose.yml       # Docker 配置
└── pnpm-workspace.yaml      # Monorepo 配置
```

## 🔧 核心功能实现

### 1. 最简单的上传处理

```typescript
// apps/api/src/routes/simple-upload.ts
import express from 'express';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    uploadId: Date.now().toString(),
    filename: req.file.originalname,
    path: req.file.path
  });
});
```

### 2. 最简单的转写调用

```typescript
// apps/api/src/services/simple-whisper.ts
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribe(filePath: string) {
  const audioFile = fs.createReadStream(filePath);

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text;
}
```

### 3. 最简单的分析

```typescript
// apps/api/src/services/simple-analyzer.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyze(transcript: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '你是面试复盘专家，请分析面试表现并给出建议。'
      },
      {
        role: 'user',
        content: `面试记录：\n${transcript}\n\n请提供：1.优点 2.不足 3.建议`
      }
    ]
  });

  return completion.choices[0].message.content;
}
```

### 4. 最简单的前端页面

```tsx
// apps/web/app/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. 上传文件
      const uploadRes = await axios.post('/api/upload', formData);

      // 2. 转写音频
      const transcribeRes = await axios.post(`/api/transcribe/${uploadRes.data.uploadId}`);

      // 3. 分析内容
      const analyzeRes = await axios.post(`/api/analyze/${uploadRes.data.uploadId}`);

      setResult(analyzeRes.data.analysis);
    } catch (error) {
      console.error('处理失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">面试复盘 MVP</h1>

      <div className="mb-8">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? '处理中...' : '开始分析'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-bold mb-4">分析结果</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
```

## 🐳 Docker 一键部署

### 最简 Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制文件
COPY . .

# 安装依赖
RUN npm install -g pnpm
RUN pnpm install

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 3000 8080

# 启动应用
CMD ["pnpm", "start"]
```

### 最简 docker-compose.yml

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

### 启动命令

```bash
# 使用 Docker Compose
docker-compose up

# 或者直接使用 Docker
docker build -t interview-replay .
docker run -p 3000:3000 -p 8080:8080 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -v $(pwd)/uploads:/app/uploads \
  interview-replay
```

## 📊 成本估算

### API 成本（基于 OpenAI 定价）

| 服务 | 单价 | 预估使用量 | 月成本 |
|------|------|-----------|--------|
| Whisper API | $0.006/分钟 | 100小时 | $36 |
| GPT-3.5 | $0.002/1K tokens | 500K tokens | $1 |
| **总计** | - | - | **~$37/月** |

### 基础设施成本

| 资源 | 规格 | 月成本 |
|------|------|--------|
| VPS (DigitalOcean) | 2GB RAM, 1 CPU | $12 |
| 存储 | 50GB | 包含在VPS内 |
| 域名 | .com | $1 |
| **总计** | - | **~$13/月** |

**MVP总成本**: 约 $50/月

## ⚡ 性能指标

### MVP 目标性能

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 音频上传 | < 10秒 (10MB文件) | 本地网络 |
| 转写速度 | 1:1 实时比 | 30分钟音频30分钟处理 |
| 分析时间 | < 30秒 | GPT-3.5响应 |
| 并发用户 | 10-20 | 单机部署 |
| 存储容量 | 50GB | 约500个面试录音 |

## 🎯 MVP 功能清单

### ✅ 已实现（核心功能）
- [x] 音频文件上传
- [x] OpenAI Whisper 转写
- [x] GPT-3.5 基础分析
- [x] 结果展示页面
- [x] 本地文件存储

### ⏳ 待实现（下一阶段）
- [ ] 用户登录系统
- [ ] 历史记录查看
- [ ] 批量处理
- [ ] 导出 PDF 报告
- [ ] 高级分析指标

### ❌ 不在 MVP 范围
- 多语言支持
- 实时转写
- 视频面试支持
- 团队协作功能
- 付费订阅系统

## 🐛 常见问题

### Q: OpenAI API 调用失败
```bash
# 检查 API Key
echo $OPENAI_API_KEY

# 测试 API 连接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Q: 上传大文件失败
```javascript
// 增加上传限制 (apps/api/src/server.ts)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
```

### Q: SQLite 数据库锁定
```bash
# 检查并修复数据库
sqlite3 data/database.sqlite "PRAGMA integrity_check;"
sqlite3 data/database.sqlite "VACUUM;"
```

## 📚 学习资源

### 核心技术文档
- [Next.js 14 文档](https://nextjs.org/docs)
- [OpenAI API 参考](https://platform.openai.com/docs)
- [Express.js 指南](https://expressjs.com/zh-cn/)
- [SQLite 教程](https://www.sqlite.org/docs.html)

### 相关教程
- [使用 Whisper API 进行音频转写](https://platform.openai.com/docs/guides/speech-to-text)
- [GPT 最佳实践](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Next.js + Express 全栈开发](https://www.youtube.com/watch?v=...)

## 🚢 生产部署建议

### 1. 使用 PM2 管理进程
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. 配置 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8080;
    }
}
```

### 3. 设置 SSL 证书
```bash
# 使用 Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 📈 从 MVP 到生产

### 第1阶段：MVP（当前）
- 基础功能验证
- 单机部署
- 手动运维

### 第2阶段：Beta（1个月后）
- 添加用户系统
- 优化性能
- 自动化部署

### 第3阶段：生产（3个月后）
- 微服务架构
- Kubernetes 部署
- 完整监控系统

## 联系和支持

- 项目仓库: [GitHub](#)
- 问题反馈: [Issues](#)
- 技术讨论: [Discussions](#)