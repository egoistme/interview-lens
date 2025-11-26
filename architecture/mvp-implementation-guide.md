# MVP 实现指南

## 一、项目初始化

### 1.1 创建 Monorepo 结构

```bash
# 创建项目目录
mkdir interview-replay-mvp
cd interview-replay-mvp

# 初始化 pnpm workspace
pnpm init

# 创建 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 创建基础目录结构
mkdir -p apps/web apps/api packages/shared
mkdir -p uploads reports data
```

### 1.2 初始化 Next.js 前端

```bash
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir
pnpm add @radix-ui/react-dialog @radix-ui/react-progress
pnpm add axios react-dropzone socket.io-client
pnpm add -D @types/socket.io-client
```

### 1.3 初始化 Express 后端

```bash
cd ../api
pnpm init
pnpm add express cors helmet morgan compression dotenv
pnpm add multer sqlite3 openai socket.io uuid
pnpm add -D @types/express @types/node @types/multer @types/cors
pnpm add -D typescript tsx nodemon
```

## 二、核心代码实现

### 2.1 后端 API 实现

#### 主服务器文件 (`apps/api/src/server.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import uploadRouter from './routes/upload';
import transcribeRouter from './routes/transcribe';
import analyzeRouter from './routes/analyze';
import reportRouter from './routes/report';
import { initDatabase } from './db/init';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 将 io 实例附加到 req 对象
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// 路由
app.use('/api/upload', uploadRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/report', reportRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

// 启动服务器
const PORT = process.env.PORT || 8080;

async function start() {
  await initDatabase();
  httpServer.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

start().catch(console.error);
```

#### 文件上传路由 (`apps/api/src/routes/upload.ts`)

```typescript
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式'));
    }
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const uploadId = uuidv4();

    // 保存到数据库
    await db.run(
      `INSERT INTO uploads (id, filename, file_path, file_size, mime_type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uploadId,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        'uploaded'
      ]
    );

    // 发送 WebSocket 事件
    (req as any).io.emit('upload:complete', { uploadId });

    res.json({
      uploadId,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

export default router;
```

#### ASR 转写服务 (`apps/api/src/services/whisper.ts`)

```typescript
import OpenAI from 'openai';
import fs from 'fs';
import { db } from '../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(uploadId: string, filePath: string) {
  try {
    // 获取文件
    const audioFile = fs.createReadStream(filePath);

    // 调用 Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    // 保存转写结果
    const transcriptId = `transcript_${Date.now()}`;
    await db.run(
      `INSERT INTO transcripts (id, upload_id, text, segments, word_count, duration)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        transcriptId,
        uploadId,
        transcription.text,
        JSON.stringify(transcription.segments),
        transcription.text.split(/\s+/).length,
        transcription.duration
      ]
    );

    // 更新上传状态
    await db.run(
      `UPDATE uploads SET status = ? WHERE id = ?`,
      ['transcribed', uploadId]
    );

    return {
      transcriptId,
      text: transcription.text,
      segments: transcription.segments
    };
  } catch (error) {
    console.error('转写错误:', error);
    throw error;
  }
}
```

#### LLM 分析服务 (`apps/api/src/services/analyzer.ts`)

```typescript
import OpenAI from 'openai';
import { db } from '../db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  score: number;
  technicalDepth: {
    score: number;
    feedback: string;
  };
  communicationSkills: {
    score: number;
    feedback: string;
  };
}

export async function analyzeInterview(
  uploadId: string,
  transcript: string,
  context?: string
): Promise<AnalysisResult> {
  try {
    const systemPrompt = `你是一位经验丰富的技术面试官和职业顾问。请分析这份面试记录，提供专业的复盘建议。

请按以下格式返回 JSON：
{
  "summary": "整体表现总结（100-200字）",
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["待改进点1", "待改进点2", "待改进点3"],
  "suggestions": ["具体建议1", "具体建议2", "具体建议3"],
  "score": 75,  // 0-100分
  "technicalDepth": {
    "score": 80,
    "feedback": "技术深度评价"
  },
  "communicationSkills": {
    "score": 70,
    "feedback": "沟通能力评价"
  }
}`;

    const userPrompt = `面试记录：
${transcript}

${context ? `额外背景信息：\n${context}` : ''}

请提供详细的面试复盘分析。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // 保存分析结果
    const reportId = `report_${Date.now()}`;
    await db.run(
      `INSERT INTO reports (id, upload_id, summary, analysis, score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reportId,
        uploadId,
        analysis.summary,
        JSON.stringify(analysis),
        analysis.score
      ]
    );

    // 更新状态
    await db.run(
      `UPDATE uploads SET status = ? WHERE id = ?`,
      ['analyzed', uploadId]
    );

    return analysis;
  } catch (error) {
    console.error('分析错误:', error);
    throw error;
  }
}
```

### 2.2 前端核心组件

#### 文件上传组件 (`apps/web/components/FileUpload.tsx`)

```tsx
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileAudio, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (uploadId: string) => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      onUploadComplete(response.data.uploadId);
    } catch (error) {
      console.error('上传失败:', error);
      alert('文件上传失败，请重试');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
          <p className="text-gray-600">正在上传... {progress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isDragActive ? (
            <FileAudio className="w-12 h-12 mx-auto text-blue-500" />
          ) : (
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
          )}
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? '释放以上传' : '拖拽音频文件到这里'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              或者点击选择文件（支持 MP3、WAV、M4A，最大 100MB）
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 分析进度组件 (`apps/web/components/AnalysisProgress.tsx`)

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface AnalysisProgressProps {
  uploadId: string;
  onComplete: (reportId: string) => void;
}

export function AnalysisProgress({ uploadId, onComplete }: AnalysisProgressProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stage, setStage] = useState<'transcribing' | 'analyzing' | 'completed'>('transcribing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');
    setSocket(newSocket);

    newSocket.on('transcribe:progress', (data) => {
      if (data.uploadId === uploadId) {
        setProgress(data.progress);
      }
    });

    newSocket.on('transcribe:complete', (data) => {
      if (data.uploadId === uploadId) {
        setStage('analyzing');
        setProgress(0);
        startAnalysis();
      }
    });

    newSocket.on('analyze:complete', (data) => {
      if (data.uploadId === uploadId) {
        setStage('completed');
        onComplete(data.reportId);
      }
    });

    // 开始转写
    startTranscription();

    return () => {
      newSocket.close();
    };
  }, [uploadId]);

  const startTranscription = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe/${uploadId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('转写启动失败:', error);
    }
  };

  const startAnalysis = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze/${uploadId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('分析启动失败:', error);
    }
  };

  const stages = [
    {
      key: 'transcribing',
      label: '音频转写',
      description: '正在将音频转换为文本...'
    },
    {
      key: 'analyzing',
      label: '智能分析',
      description: '正在进行面试复盘分析...'
    },
    {
      key: 'completed',
      label: '完成',
      description: '分析完成！'
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">处理进度</h2>

      <div className="space-y-4">
        {stages.map((s, index) => {
          const isActive = s.key === stage;
          const isCompleted = stages.findIndex(st => st.key === stage) > index;

          return (
            <div key={s.key} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="flex-grow">
                <h3 className={`font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {s.label}
                </h3>
                <p className="text-sm text-gray-600">{s.description}</p>

                {isActive && stage !== 'completed' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## 三、数据库初始化

### SQLite 初始化脚本 (`apps/api/src/db/init.ts`)

```typescript
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export const db = await open({
  filename: path.join(process.cwd(), 'data', 'database.sqlite'),
  driver: sqlite3.Database
});

export async function initDatabase() {
  // 创建上传表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      status TEXT DEFAULT 'uploaded',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建转写表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      upload_id TEXT,
      text TEXT NOT NULL,
      segments TEXT,
      word_count INTEGER,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (upload_id) REFERENCES uploads(id)
    )
  `);

  // 创建报告表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      upload_id TEXT,
      transcript_id TEXT,
      summary TEXT,
      analysis TEXT,
      score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (upload_id) REFERENCES uploads(id),
      FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
    )
  `);

  console.log('数据库初始化完成');
}
```

## 四、Docker 部署配置

### Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# 创建必要的目录
RUN mkdir -p uploads reports data && chown -R nodejs:nodejs uploads reports data

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nodejs

EXPOSE 3000 8080

CMD ["pnpm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: interview-replay
    ports:
      - "3000:3000"  # Next.js 前端
      - "8080:8080"  # Express API
    volumes:
      - ./uploads:/app/uploads
      - ./reports:/app/reports
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FRONTEND_URL=http://localhost:3000
      - API_URL=http://localhost:8080
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 五、环境变量配置

### .env.example

```bash
# OpenAI API 配置
OPENAI_API_KEY=your_openai_api_key_here

# 应用配置
NODE_ENV=development
PORT=8080

# URL 配置
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080

# 文件存储路径
UPLOAD_DIR=./uploads
REPORT_DIR=./reports
DATABASE_PATH=./data/database.sqlite

# 安全配置
SESSION_SECRET=your_session_secret_here
```

## 六、启动脚本

### package.json (根目录)

```json
{
  "name": "interview-replay-mvp",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:web\"",
    "dev:api": "cd apps/api && pnpm dev",
    "dev:web": "cd apps/web && pnpm dev",
    "build": "pnpm build:api && pnpm build:web",
    "build:api": "cd apps/api && pnpm build",
    "build:web": "cd apps/web && pnpm build",
    "start": "concurrently \"pnpm start:api\" \"pnpm start:web\"",
    "start:api": "cd apps/api && pnpm start",
    "start:web": "cd apps/web && pnpm start",
    "db:init": "cd apps/api && pnpm db:init",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "clean": "rm -rf uploads/* reports/* data/*"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

## 七、测试和验证

### 7.1 本地测试流程

```bash
# 1. 安装依赖
pnpm install

# 2. 设置环境变量
cp .env.example .env
# 编辑 .env 文件，添加 OpenAI API Key

# 3. 初始化数据库
pnpm db:init

# 4. 启动开发服务器
pnpm dev

# 5. 访问应用
# 前端: http://localhost:3000
# API: http://localhost:8080

# 6. 测试流程
# - 上传音频文件
# - 等待转写完成
# - 查看分析结果
```

### 7.2 Docker 测试

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down
```

## 八、常见问题处理

### Q1: OpenAI API 调用失败
- 检查 API Key 是否正确
- 确认账户余额充足
- 使用代理或 VPN（如果需要）

### Q2: 文件上传失败
- 检查文件大小限制（100MB）
- 确认文件格式支持
- 检查 uploads 目录权限

### Q3: SQLite 数据库锁定
- 避免并发写入操作
- 考虑升级到 PostgreSQL

### Q4: Docker 容器启动失败
- 检查端口占用
- 确认环境变量配置
- 查看容器日志

## 九、性能优化建议

1. **缓存策略**
   - 缓存转写结果避免重复调用
   - 使用 Redis 缓存分析结果

2. **异步处理**
   - 使用消息队列处理长时间任务
   - 实现任务重试机制

3. **文件管理**
   - 定期清理旧文件
   - 压缩存储音频文件

4. **API 优化**
   - 实现请求限流
   - 使用 CDN 加速静态资源

## 十、下一步计划

### 短期改进（1-2周）
- [ ] 添加简单的用户认证
- [ ] 实现历史记录查看
- [ ] 优化移动端体验
- [ ] 添加更多分析维度

### 中期升级（1个月）
- [ ] 引入 LangGraph 工作流
- [ ] 添加向量数据库
- [ ] 实现批量处理
- [ ] 支持更多音频格式

### 长期演进（3个月）
- [ ] 微服务架构改造
- [ ] Kubernetes 部署
- [ ] 多语言支持
- [ ] 企业级功能