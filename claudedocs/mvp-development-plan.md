# 面试复盘Agent系统 - MVP开发计划

## 文档信息
- **项目名称**: Interview Replay Agent System - MVP
- **版本**: v1.0-mvp
- **更新日期**: 2025-11-25
- **开发周期**: 7个工作日
- **文档状态**: 详细开发计划

---

## 📋 目录
- [1. 项目概述](#1-项目概述)
- [2. 开发阶段划分](#2-开发阶段划分)
- [3. 每日详细任务](#3-每日详细任务)
- [4. 技术决策清单](#4-技术决策清单)
- [5. 开发环境配置](#5-开发环境配置)
- [6. 测试策略](#6-测试策略)
- [7. 部署清单](#7-部署清单)
- [8. 成本预算](#8-成本预算)
- [9. 风险管理](#9-风险管理)
- [10. 团队协作建议](#10-团队协作建议)

---

## 1. 项目概述

### 1.1 MVP目标

**核心价值**: 7个工作日内完成可部署的MVP版本，实现从音频上传到复盘报告的完整流程

**功能范围**:
- ✅ 音频文件上传和存储
- ✅ ASR自动转写 (OpenAI Whisper)
- ✅ LLM智能分析 (GPT-3.5)
- ✅ 复盘报告展示
- ✅ 处理进度追踪

### 1.2 成功标准

| 指标 | 目标值 |
|------|--------|
| 开发完成时间 | 7天 |
| 音频上传成功率 | > 95% |
| 转写准确率 | > 90% |
| 端到端处理时间 | < 5分钟 (30分钟音频) |
| 单次处理成本 | < $0.50 |
| 基础测试覆盖 | > 80% |

---

## 2. 开发阶段划分

### 阶段一: 基础搭建 (Day 0-1)
**目标**: 完成开发环境和基础框架
- 环境配置
- 项目初始化
- 数据库设计

### 阶段二: 核心开发 (Day 2-5)
**目标**: 实现所有核心功能
- 文件上传
- ASR集成
- LLM分析
- 前端界面

### 阶段三: 集成部署 (Day 6-7)
**目标**: 测试、优化和部署
- 集成测试
- Docker化
- 部署上线

---

## 3. 每日详细任务

### Day 0: 环境准备 (4小时)

#### ☑️ 任务 0.1: 开发环境搭建
**时间**: 1小时
**输入**: 系统要求文档
**输出**: 配置完成的开发环境

**执行步骤**:
```bash
# 1. 检查Node.js版本
node -v  # 需要 18+

# 2. 安装Docker Desktop
# 下载: https://www.docker.com/products/docker-desktop

# 3. 配置VSCode
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode

# 4. 初始化Git仓库
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

**验收标准**:
- [ ] Node.js 18+ 安装完成
- [ ] Docker Desktop 运行正常
- [ ] VSCode 配置完成
- [ ] Git 仓库初始化

---

#### ☑️ 任务 0.2: 前端项目初始化
**时间**: 1.5小时
**输入**: Next.js 模板
**输出**: 可运行的前端基础框架
**依赖**: 任务 0.1

**执行步骤**:
```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir

cd frontend

# 2. 安装额外依赖
npm install zustand axios lucide-react

# 3. 配置 Tailwind
# 编辑 tailwind.config.ts (使用shadcn/ui主题)

# 4. 启动开发服务器
npm run dev
```

**验收标准**:
- [ ] 成功访问 http://localhost:3000
- [ ] TypeScript 无错误
- [ ] Tailwind CSS 正常工作

---

#### ☑️ 任务 0.3: 后端项目初始化
**时间**: 1.5小时
**输入**: Express 模板
**输出**: 可运行的 API 服务
**依赖**: 任务 0.1

**执行步骤**:
```bash
# 1. 创建项目目录
mkdir backend && cd backend
npm init -y

# 2. 安装依赖
npm install express cors helmet multer sqlite3 openai dotenv
npm install -D typescript @types/node @types/express nodemon ts-node

# 3. 初始化 TypeScript
npx tsc --init

# 4. 创建基础结构
mkdir -p src/{routes,services,models,utils}
touch src/index.ts

# 5. 配置 nodemon
# 创建 nodemon.json

# 6. 启动开发服务器
npm run dev
```

**验收标准**:
- [ ] API 服务在 http://localhost:3001 运行
- [ ] TypeScript 编译正常
- [ ] 热重载工作正常

---

### Day 1: 数据库和基础API (4小时)

#### ☑️ 任务 1.1: 数据库设计和初始化
**时间**: 1.5小时
**输入**: 数据模型设计
**输出**: SQLite 数据库和 migration 脚本
**依赖**: 任务 0.3

**执行步骤**:
```bash
# 1. 创建 schema 文件
cat > backend/schema.sql << 'EOF'
CREATE TABLE interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  audio_path TEXT,
  audio_duration INTEGER,
  audio_size INTEGER,

  transcript_text TEXT,
  transcript_segments TEXT,

  analysis_json TEXT,

  status TEXT NOT NULL CHECK(status IN (
    'uploaded', 'transcribing', 'transcribed',
    'analyzing', 'completed', 'failed'
  )),

  error_message TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_created_at ON interviews(created_at DESC);
EOF

# 2. 初始化数据库
mkdir -p backend/data
sqlite3 backend/data/interviews.db < backend/schema.sql

# 3. 创建数据库工具类
touch backend/src/utils/db.ts
```

**验收标准**:
- [ ] 数据库文件创建成功
- [ ] 表结构符合设计
- [ ] 索引创建正确

---

#### ☑️ 任务 1.2: 基础 API endpoints
**时间**: 2小时
**输入**: API 设计文档
**输出**: RESTful API 基础结构
**依赖**: 任务 1.1

**执行步骤**:
```typescript
// 1. 创建路由文件 src/routes/interviews.ts
import express from 'express';
const router = express.Router();

// GET /api/interviews - 获取面试列表
router.get('/', async (req, res) => {
  // 实现分页查询
});

// GET /api/interviews/:id - 获取单个面试
router.get('/:id', async (req, res) => {
  // 实现详情查询
});

// DELETE /api/interviews/:id - 删除面试
router.delete('/:id', async (req, res) => {
  // 实现删除逻辑
});

export default router;

// 2. 在 src/index.ts 注册路由
app.use('/api/interviews', interviewRoutes);

// 3. 测试 API
curl http://localhost:3001/api/interviews
```

**验收标准**:
- [ ] GET /api/health 返回 200
- [ ] GET /api/interviews 返回空数组
- [ ] API 错误处理正确

---

#### ☑️ 任务 1.3: 文件上传 API
**时间**: 0.5小时
**输入**: Multer 配置
**输出**: 文件上传功能
**依赖**: 任务 1.2

**执行步骤**:
```typescript
// 1. 配置 Multer
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|webm/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (extname) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

// 2. 创建上传路由
router.post('/upload', upload.single('audio'), async (req, res) => {
  // 保存到数据库
  // 返回 interview_id
});

// 3. 测试上传
curl -X POST http://localhost:3001/api/upload \
  -F "audio=@test.mp3" \
  -F "title=测试面试"
```

**验收标准**:
- [ ] 文件成功上传到 uploads/ 目录
- [ ] 数据库记录创建成功
- [ ] 返回正确的 interview_id

---

### Day 2: 音频上传UI (4小时)

#### ☑️ 任务 2.1: 前端上传组件
**时间**: 2小时
**输入**: UI 设计稿
**输出**: 音频上传 React 组件
**依赖**: 任务 1.3

**执行步骤**:
```typescript
// 1. 创建 components/AudioUploader.tsx
'use client';

import { useState } from 'react';
import { Upload, FileAudio } from 'lucide-react';

export function AudioUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      // 跳转到详情页
      window.location.href = `/interviews/${data.interviewId}`;
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      {/* 实现拖拽上传UI */}
    </div>
  );
}

// 2. 在首页使用组件
// app/page.tsx
import { AudioUploader } from '@/components/AudioUploader';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1>面试复盘 AI 助手</h1>
      <AudioUploader />
    </main>
  );
}
```

**验收标准**:
- [ ] 支持拖拽上传
- [ ] 文件类型验证正确
- [ ] 上传进度显示
- [ ] 错误提示友好

---

#### ☑️ 任务 2.2: 上传状态管理
**时间**: 1小时
**输入**: 状态管理需求
**输出**: Zustand store
**依赖**: 任务 2.1

**执行步骤**:
```typescript
// 1. 创建 store/interviewStore.ts
import { create } from 'zustand';

interface InterviewState {
  currentInterviewId: string | null;
  uploadProgress: number;
  isUploading: boolean;

  setCurrentInterview: (id: string) => void;
  setUploadProgress: (progress: number) => void;
  startUpload: () => void;
  finishUpload: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentInterviewId: null,
  uploadProgress: 0,
  isUploading: false,

  setCurrentInterview: (id) => set({ currentInterviewId: id }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  startUpload: () => set({ isUploading: true, uploadProgress: 0 }),
  finishUpload: () => set({ isUploading: false, uploadProgress: 100 }),
}));

// 2. 在组件中使用
import { useInterviewStore } from '@/store/interviewStore';

const { startUpload, setUploadProgress } = useInterviewStore();
```

**验收标准**:
- [ ] 状态管理正常工作
- [ ] 上传进度实时更新
- [ ] 错误状态正确显示

---

#### ☑️ 任务 2.3: 文件存储优化
**时间**: 1小时
**输入**: 存储策略
**输出**: 文件管理服务
**依赖**: 任务 1.3

**执行步骤**:
```typescript
// 1. 创建 services/storageService.ts
import fs from 'fs';
import path from 'path';

export class StorageService {
  private uploadDir = './uploads';

  // 按日期组织文件
  getDatePath(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return path.join(this.uploadDir, `${year}-${month}-${day}`);
  }

  // 确保目录存在
  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // 生成唯一文件名
  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(originalName);
    return `${timestamp}-${random}${ext}`;
  }

  // 删除旧文件 (可选的清理机制)
  async cleanOldFiles(daysOld: number = 30): Promise<void> {
    // 实现定期清理逻辑
  }
}
```

**验收标准**:
- [ ] 文件按日期组织
- [ ] 文件名唯一
- [ ] 目录自动创建

---

### Day 3: ASR集成 (4小时)

#### ☑️ 任务 3.1: OpenAI Whisper API集成
**时间**: 2小时
**输入**: OpenAI API 密钥
**输出**: ASR 服务模块
**依赖**: 任务 1.3

**执行步骤**:
```typescript
// 1. 创建 services/whisperService.ts
import OpenAI from 'openai';
import fs from 'fs';

export class WhisperService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async transcribe(audioPath: string): Promise<TranscriptResult> {
    const stats = fs.statSync(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    // Whisper API 限制 25MB
    if (fileSizeMB > 25) {
      return this.transcribeLargeFile(audioPath);
    }

    const response = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'zh',
      response_format: 'verbose_json',
    });

    return {
      text: response.text,
      segments: response.segments,
      duration: response.duration,
    };
  }

  private async transcribeLargeFile(
    audioPath: string
  ): Promise<TranscriptResult> {
    // 实现大文件分片处理
    // 1. 使用 ffmpeg 分割音频
    // 2. 逐片调用 Whisper API
    // 3. 合并结果
  }
}

// 2. 在 .env 添加 API key
OPENAI_API_KEY=sk-your-api-key

// 3. 测试转写
const whisper = new WhisperService(process.env.OPENAI_API_KEY!);
const result = await whisper.transcribe('./test.mp3');
console.log(result.text);
```

**验收标准**:
- [ ] 成功调用 Whisper API
- [ ] 返回转写文本
- [ ] 处理错误情况

---

#### ☑️ 任务 3.2: 异步任务队列
**时间**: 1.5小时
**输入**: 队列需求
**输出**: 简单任务队列实现
**依赖**: 任务 3.1

**执行步骤**:
```typescript
// 1. 创建简单的内存队列 services/queueService.ts
type JobHandler = (data: any) => Promise<void>;

export class SimpleQueue {
  private queue: Array<{ id: string; data: any; handler: JobHandler }> = [];
  private processing = false;

  async add(id: string, data: any, handler: JobHandler) {
    this.queue.push({ id, data, handler });
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      try {
        await job.handler(job.data);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        // 实现重试逻辑
      }
    }

    this.processing = false;
  }
}

// 2. 使用队列处理转写任务
const queue = new SimpleQueue();

router.post('/upload', upload.single('audio'), async (req, res) => {
  // 创建记录
  const interview = await createInterview(req.file);

  // 添加到队列
  queue.add(interview.id, { audioPath: req.file.path }, async (data) => {
    await processInterview(interview.id, data.audioPath);
  });

  res.json({ interviewId: interview.id });
});

async function processInterview(id: string, audioPath: string) {
  // 1. 更新状态为 transcribing
  await updateStatus(id, 'transcribing');

  // 2. 调用 Whisper
  const transcript = await whisperService.transcribe(audioPath);

  // 3. 保存转写结果
  await saveTranscript(id, transcript);

  // 4. 更新状态为 transcribed
  await updateStatus(id, 'transcribed');
}
```

**验收标准**:
- [ ] 队列正常工作
- [ ] 支持并发处理
- [ ] 状态更新到数据库

---

#### ☑️ 任务 3.3: 转写结果处理
**时间**: 0.5小时
**输入**: 转写文本
**输出**: 格式化的转写结果
**依赖**: 任务 3.2

**执行步骤**:
```typescript
// 处理转写结果，提取关键信息
interface ProcessedTranscript {
  text: string;
  segments: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  duration: number;
  wordCount: number;
}

function processTranscript(rawTranscript: any): ProcessedTranscript {
  return {
    text: rawTranscript.text,
    segments: rawTranscript.segments.map((seg: any) => ({
      text: seg.text,
      start: seg.start,
      end: seg.end,
    })),
    duration: rawTranscript.duration,
    wordCount: rawTranscript.text.split(/\s+/).length,
  };
}
```

**验收标准**:
- [ ] 转写结果格式正确
- [ ] 时间戳保留
- [ ] 存储到数据库

---

### Day 4: LLM分析功能 (4小时)

#### ☑️ 任务 4.1: GPT-3.5 API集成
**时间**: 1.5小时
**输入**: OpenAI API 配置
**输出**: LLM 服务模块
**依赖**: 任务 3.3

**执行步骤**:
```typescript
// 1. 创建 services/gptService.ts
import OpenAI from 'openai';

export class GPTService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeInterview(transcript: string): Promise<AnalysisResult> {
    const systemPrompt = `你是一位专业的面试复盘助手。请分析面试对话，输出JSON格式的复盘报告。`;

    const userPrompt = this.buildPrompt(transcript);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{}');
  }

  private buildPrompt(transcript: string): string {
    return `
请分析以下面试对话，输出JSON格式的复盘报告：

## 面试对话
${transcript}

## 输出格式要求
{
  "summary": "面试总体概述（100字以内）",
  "questions": [
    {
      "question": "面试官提出的问题",
      "answer": "候选人的回答",
      "evaluation": "对回答的评价",
      "score": 85,
      "strengths": ["回答的优点"],
      "weaknesses": ["回答的不足"],
      "suggestions": ["改进建议"]
    }
  ],
  "overall": {
    "strengths": ["整体优点"],
    "weaknesses": ["整体不足"],
    "score": 80,
    "recommendations": ["改进建议"]
  }
}
    `;
  }
}

// 2. 测试分析功能
const gpt = new GPTService(process.env.OPENAI_API_KEY!);
const analysis = await gpt.analyzeInterview(transcript);
console.log(analysis);
```

**验收标准**:
- [ ] 成功调用 GPT API
- [ ] 返回结构化分析
- [ ] JSON 格式正确

---

#### ☑️ 任务 4.2: Prompt优化
**时间**: 1.5小时
**输入**: 分析需求
**输出**: 优化的 prompt 模板
**依赖**: 任务 4.1

**执行步骤**:
```typescript
// 优化 prompt，提高分析质量
private buildPrompt(transcript: string): string {
  return `
你是一位资深的技术面试官和职业发展顾问。请对以下面试对话进行深入分析。

## 分析维度
1. **问题识别**: 准确提取面试官的每个问题
2. **回答评估**: 评价候选人的回答质量
   - 技术准确性
   - 逻辑清晰度
   - 表达完整性
3. **优势分析**: 指出候选人的亮点
4. **改进建议**: 提供具体、可操作的建议

## 面试对话
${transcript}

## 输出格式（必须是有效的JSON）
{
  "summary": "用1-2句话概括面试整体表现",
  "questions": [
    {
      "question": "问题原文",
      "answer": "回答原文（简要）",
      "evaluation": "详细评价",
      "score": 85,
      "strengths": ["优点1", "优点2"],
      "weaknesses": ["不足1"],
      "suggestions": ["建议1", "建议2"]
    }
  ],
  "overall": {
    "strengths": ["整体优点1", "整体优点2"],
    "weaknesses": ["整体不足1"],
    "score": 80,
    "recommendations": ["改进建议1", "改进建议2", "学习资源推荐"]
  }
}

注意：
- 评分范围 0-100
- 建议要具体、可操作
- 语气专业但友好
  `;
}
```

**验收标准**:
- [ ] 分析结果质量高
- [ ] 评价客观准确
- [ ] 建议具体可行

---

#### ☑️ 任务 4.3: 分析结果存储
**时间**: 1小时
**输入**: LLM 输出
**输出**: 结构化存储方案
**依赖**: 任务 4.2

**执行步骤**:
```typescript
// 完善处理流程
async function processInterview(id: string, audioPath: string) {
  try {
    // 1. 转写
    await updateStatus(id, 'transcribing');
    const transcript = await whisperService.transcribe(audioPath);
    await saveTranscript(id, transcript);

    // 2. 分析
    await updateStatus(id, 'analyzing');
    const analysis = await gptService.analyzeInterview(transcript.text);
    await saveAnalysis(id, analysis);

    // 3. 完成
    await updateStatus(id, 'completed');
  } catch (error) {
    await updateStatus(id, 'failed', error.message);
    throw error;
  }
}

async function saveAnalysis(id: string, analysis: AnalysisResult) {
  const db = await getDatabase();
  await db.run(
    `UPDATE interviews
     SET analysis_json = ?,
         completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [JSON.stringify(analysis), id]
  );
}
```

**验收标准**:
- [ ] 分析结果正确存储
- [ ] 支持 JSON 查询
- [ ] 完成时间记录

---

### Day 5: 前端界面开发 (4小时)

#### ☑️ 任务 5.1: 会议列表页
**时间**: 1小时
**输入**: UI 设计
**输出**: 会议列表组件
**依赖**: 任务 2.1

**执行步骤**:
```typescript
// app/interviews/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { FileAudio, Clock, CheckCircle } from 'lucide-react';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    fetch('/api/interviews')
      .then((res) => res.json())
      .then((data) => setInterviews(data.interviews));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">我的面试</h1>

      <div className="grid gap-4">
        {interviews.map((interview) => (
          <InterviewCard key={interview.id} interview={interview} />
        ))}
      </div>
    </div>
  );
}

function InterviewCard({ interview }) {
  const statusIcon = {
    completed: <CheckCircle className="text-green-500" />,
    processing: <Clock className="text-blue-500 animate-spin" />,
    failed: <XCircle className="text-red-500" />,
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileAudio className="text-gray-400" />
          <div>
            <h3 className="font-semibold">{interview.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(interview.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {statusIcon[interview.status]}
      </div>
    </div>
  );
}
```

**验收标准**:
- [ ] 列表正确显示
- [ ] 状态图标正确
- [ ] 响应式设计

---

#### ☑️ 任务 5.2: 会议详情页
**时间**: 2小时
**输入**: 详情页设计
**输出**: 会议详情组件
**依赖**: 任务 5.1

**执行步骤**:
```typescript
// app/interviews/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function InterviewDetailPage() {
  const params = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/interviews/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInterview(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <LoadingSpinner />;
  if (!interview) return <NotFound />;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{interview.title}</h1>

      {/* 转写文本 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">转写文本</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="whitespace-pre-wrap">{interview.transcriptText}</p>
        </div>
      </section>

      {/* 分析报告 */}
      {interview.analysis && (
        <section>
          <h2 className="text-xl font-semibold mb-3">分析报告</h2>
          <ReportViewer analysis={interview.analysis} />
        </section>
      )}
    </div>
  );
}

function ReportViewer({ analysis }) {
  return (
    <div className="space-y-6">
      {/* 总体概述 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">总体概述</h3>
        <p>{analysis.summary}</p>
      </div>

      {/* 问题分析 */}
      <div>
        <h3 className="font-semibold mb-3">问题分析</h3>
        {analysis.questions.map((q, i) => (
          <QuestionCard key={i} question={q} />
        ))}
      </div>

      {/* 总体评价 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
        <h3 className="font-semibold mb-3">总体评价</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">优势</h4>
            <ul className="space-y-1">
              {analysis.overall.strengths.map((s, i) => (
                <li key={i} className="text-sm">✓ {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-orange-700 mb-2">改进空间</h4>
            <ul className="space-y-1">
              {analysis.overall.weaknesses.map((w, i) => (
                <li key={i} className="text-sm">→ {w}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**验收标准**:
- [ ] 详情页正确显示
- [ ] 分析报告清晰易读
- [ ] 响应式设计

---

#### ☑️ 任务 5.3: 实时状态更新
**时间**: 1小时
**输入**: 轮询需求
**输出**: 实时更新机制
**依赖**: 任务 5.2

**执行步骤**:
```typescript
// 使用轮询实现实时更新
function useInterviewStatus(interviewId: string) {
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const pollStatus = async () => {
      const res = await fetch(`/api/interviews/${interviewId}/progress`);
      const data = await res.json();
      setStatus(data.stage);

      // 如果未完成，继续轮询
      if (data.stage !== 'completed' && data.stage !== 'failed') {
        setTimeout(pollStatus, 2000); // 每2秒轮询一次
      }
    };

    pollStatus();
  }, [interviewId]);

  return status;
}

// 在详情页使用
const status = useInterviewStatus(params.id);

return (
  <div>
    {status === 'transcribing' && <ProcessingBanner stage="正在转写音频..." />}
    {status === 'analyzing' && <ProcessingBanner stage="正在分析面试..." />}
    {status === 'completed' && <CompletedBanner />}
  </div>
);
```

**验收标准**:
- [ ] 状态实时更新
- [ ] 轮询在完成后停止
- [ ] 用户体验流畅

---

### Day 6: 集成测试 (4小时)

#### ☑️ 任务 6.1: 端到端测试
**时间**: 2小时
**输入**: 测试用例
**输出**: 测试报告

**执行步骤**:
```bash
# 1. 准备测试音频文件
mkdir test-assets
# 下载或录制 5 个不同的测试音频

# 2. 手动测试完整流程
# Test Case 1: 正常流程
- 上传 30 分钟音频
- 等待处理完成
- 验证转写准确率
- 验证分析报告质量

# Test Case 2: 大文件
- 上传 60 分钟音频
- 验证分片处理

# Test Case 3: 错误文件
- 上传非音频文件
- 验证错误提示

# Test Case 4: 并发上传
- 同时上传 3 个文件
- 验证队列处理

# Test Case 5: 中断恢复
- 上传过程中关闭浏览器
- 重新打开验证状态

# 3. 记录测试结果
cat > test-report.md << EOF
# 测试报告

## Test Case 1: 正常流程 ✅
- 上传成功
- 转写准确率: 92%
- 分析报告: 合理

## Test Case 2: 大文件 ✅
- 分片处理正常
- 耗时: 8 分钟

...
EOF
```

**验收标准**:
- [ ] 所有测试用例通过
- [ ] 无阻塞性 bug
- [ ] 性能符合预期

---

#### ☑️ 任务 6.2: 性能优化
**时间**: 1小时
**输入**: 性能指标
**输出**: 优化后的代码

**优化清单**:
```typescript
// 1. 前端优化
// - 添加 Loading 骨架屏
// - 图片懒加载
// - 代码分割

// 2. 后端优化
// - 添加请求日志
// - 数据库查询优化
// - API 响应缓存

// 3. 音频处理优化
// - 并发限制（避免 OOM）
const queue = new SimpleQueue({ concurrency: 2 });

// - 添加超时机制
const timeout = 5 * 60 * 1000; // 5分钟

// 4. 错误处理优化
// - 统一错误格式
// - 错误日志记录
// - 用户友好的错误提示
```

**验收标准**:
- [ ] 页面加载 < 3秒
- [ ] API 响应 < 500ms
- [ ] 内存使用稳定

---

#### ☑️ 任务 6.3: Bug修复
**时间**: 1小时
**输入**: 测试发现的问题
**输出**: 修复后的版本

**修复清单**:
- [ ] 修复 P0 bug（阻塞性问题）
- [ ] 修复 P1 bug（重要但不阻塞）
- [ ] 优化用户体验
- [ ] 完善错误提示

---

### Day 7: Docker化和部署 (4小时)

#### ☑️ 任务 7.1: Docker镜像构建
**时间**: 1.5小时
**输入**: Dockerfile 模板
**输出**: Docker 镜像

**执行步骤**:
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]

# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]

# 构建镜像
docker build -t interview-frontend ./frontend
docker build -t interview-backend ./backend
```

**验收标准**:
- [ ] 镜像构建成功
- [ ] 镜像大小合理
- [ ] 多阶段构建优化

---

#### ☑️ 任务 7.2: Docker Compose配置
**时间**: 1小时
**输入**: 服务配置
**输出**: docker-compose.yml

**执行步骤**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_PATH=/data/interviews.db
      - UPLOAD_PATH=/data/uploads
      - NODE_ENV=production
    volumes:
      - ./data:/data
    restart: unless-stopped

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**验收标准**:
- [ ] 服务正常启动
- [ ] 网络配置正确
- [ ] 数据持久化

---

#### ☑️ 任务 7.3: 生产环境部署
**时间**: 1.5小时
**输入**: 服务器访问
**输出**: 运行中的应用

**部署步骤**:
```bash
# 1. 准备服务器（Ubuntu 20.04+）
# 安装 Docker 和 Docker Compose

# 2. 上传代码
git clone <repository-url>
cd agent-learning-fullstack

# 3. 配置环境变量
cat > .env << EOF
OPENAI_API_KEY=sk-your-api-key-here
EOF

# 4. 部署
./deploy.sh

# 5. 配置 Nginx 反向代理（可选）
# 6. 配置 HTTPS（可选）
```

**验收标准**:
- [ ] 应用可公网访问
- [ ] 服务稳定运行
- [ ] 日志正常记录

---

## 4. 技术决策清单

### 4.1 ASR服务选择

| 方案 | 优点 | 缺点 | MVP选择 |
|------|------|------|---------|
| OpenAI Whisper API | 简单、准确、无需GPU | 有成本、API限制 | ✅ 推荐 |
| 本地Whisper | 无API成本、数据隐私 | 需要GPU、部署复杂 | ❌ |
| Azure Speech | 企业级、多语言 | 配置复杂、成本高 | ❌ |

**最终选择**: OpenAI Whisper API
**理由**: MVP阶段优先快速验证，成本可控

### 4.2 LLM选择

| 方案 | 优点 | 缺点 | MVP选择 |
|------|------|------|---------|
| GPT-3.5-turbo | 成本低、速度快 | 能力有限 | ✅ 推荐 |
| GPT-4 | 能力强、理解深 | 成本高、速度慢 | ⚠️ 可选 |

**最终选择**: GPT-3.5-turbo（默认），GPT-4（可选）
**理由**: MVP用GPT-3.5足够，节省成本

---

## 5. 开发环境配置

### 5.1 本地环境Setup脚本

```bash
#!/bin/bash
# setup.sh - 一键环境搭建脚本

echo "🚀 开始搭建开发环境..."

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 2. 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker Desktop"
    exit 1
fi
echo "✅ Docker $(docker -v)"

# 3. 创建项目目录
mkdir -p agent-learning-fullstack/{frontend,backend,data/uploads}
cd agent-learning-fullstack

# 4. 初始化前端
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --yes
npm install zustand axios lucide-react

# 5. 初始化后端
cd ../backend
npm init -y
npm install express cors helmet multer sqlite3 openai dotenv
npm install -D typescript @types/node @types/express nodemon ts-node

# 6. 创建环境变量模板
cat > .env.example << EOF
OPENAI_API_KEY=sk-your-api-key-here
DATABASE_PATH=./data/interviews.db
UPLOAD_PATH=./data/uploads
PORT=3001
NODE_ENV=development
EOF

# 7. 初始化数据库
cd ..
cat > backend/schema.sql << EOF
-- 见 Day 1 任务 1.1
EOF
sqlite3 data/interviews.db < backend/schema.sql

echo "✅ 环境搭建完成!"
echo "📝 下一步:"
echo "   1. cd backend && cp .env.example .env"
echo "   2. 编辑 .env 文件，填入 OPENAI_API_KEY"
echo "   3. npm run dev 启动开发服务器"
```

---

## 6. 测试策略

### 6.1 单元测试

```typescript
// 使用 Jest 进行单元测试
// tests/whisperService.test.ts
describe('WhisperService', () => {
  test('应正确处理小文件', async () => {
    const result = await whisperService.transcribe('test/small.mp3');
    expect(result.text).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });
});
```

### 6.2 集成测试场景

1. **完整流程测试**: 上传 → 转写 → 分析 → 查看
2. **并发测试**: 同时上传3个文件
3. **错误恢复**: API失败重试
4. **边界测试**: 大文件、空文件、错误格式

---

## 7. 部署清单

- [ ] 环境变量配置
- [ ] 数据库初始化
- [ ] Docker镜像构建
- [ ] Docker Compose启动
- [ ] 健康检查通过
- [ ] 日志配置
- [ ] 备份策略

---

## 8. 成本预算

### 开发阶段成本

| 项目 | 数量 | 单价 | 总价 |
|------|------|------|------|
| OpenAI API测试 | 50次 | $0.30 | $15 |
| 域名(可选) | 1个 | $12/年 | $1 |
| **总计** | - | - | **$16** |

### MVP运行成本（月度）

| 项目 | 用量 | 单价 | 月成本 |
|------|------|------|--------|
| Whisper API | 1000分钟 | $0.006/分钟 | $6 |
| GPT-3.5 | 100K tokens | $0.002/1K | $0.20 |
| VPS | 2核4G | $20/月 | $20 |
| 存储 | 10GB | $0.5/GB | $5 |
| **总计** | - | - | **$31.20/月** |

---

## 9. 风险管理

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| OpenAI API限流 | 高 | 中 | 实现队列和指数退避重试 |
| 音频文件过大 | 中 | 高 | 前端限制100MB，后端分片处理 |
| 转写准确率低 | 高 | 低 | 提供手动编辑功能 |
| API成本超支 | 中 | 中 | 设置日限额，实时监控 |
| 并发崩溃 | 高 | 低 | 队列限流，最多同时处理2个 |

---

## 10. 团队协作建议

### 单人开发模式

**每日节奏**:
- 上午: 核心开发任务（4小时）
- 下午: 集成测试
- 晚上: 文档和计划

**优先级**:
1. 后端API优先
2. 核心功能串联
3. 前端UI完善

### 2人团队模式

**开发者A (后端)**:
- Day 0-1: 环境搭建
- Day 2-4: ASR + LLM集成
- Day 5-6: 测试优化
- Day 7: 部署

**开发者B (前端)**:
- Day 0-1: 前端框架
- Day 2-3: 上传组件
- Day 4-5: 页面开发
- Day 6-7: 集成测试

---

## 快速启动命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# Docker启动
docker-compose up -d

# 运行测试
npm test

# 部署生产
./deploy.sh
```

---

## MVP完成定义

- [ ] 音频上传成功率 > 95%
- [ ] 转写准确率 > 90%
- [ ] 分析报告有意义
- [ ] 响应时间 < 3秒
- [ ] 可处理30分钟音频
- [ ] 支持3种音频格式
- [ ] 移动端可用
- [ ] 部署文档完整
- [ ] 至少10个测试用例通过

---

**文档维护者**: Claude Code
**最后更新**: 2025-11-25
**文档状态**: ✅ MVP开发计划已完成
