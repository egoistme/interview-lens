import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { LangChainAdapter } from 'ai';
import { ChatRequestSchema, ChatResponseSchema } from '@interview-lens/shared-types';
import { createAgent } from './agent';

// 验证必要的环境变量
const ZHIPUAI_API_KEY = process.env.ZHIPUAI_API_KEY;
if (!ZHIPUAI_API_KEY) {
  console.error('❌ ZHIPUAI_API_KEY is required');
  process.exit(1);
}

// 创建 Agent 实例
const agent = createAgent({
  apiKey: ZHIPUAI_API_KEY,
  model: process.env.ZHIPUAI_MODEL || 'glm-4-flash',
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const validatedRequest = ChatRequestSchema.parse(req.body);

    const response = await agent.run(validatedRequest.message);

    const chatResponse = {
      response,
      conversationId: validatedRequest.conversationId || `conv_${Date.now()}`,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date(),
    };

    const validatedResponse = ChatResponseSchema.parse(chatResponse);
    res.json(validatedResponse);
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Error) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message,
        statusCode: 400,
        timestamp: new Date(),
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
        timestamp: new Date(),
      });
    }
  }
});

// 面试转录分析端点（流式响应）
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: '请提供面试转录文本',
        statusCode: 400,
        timestamp: new Date(),
      });
      return;
    }

    if (prompt.trim().length < 10) {
      res.status(400).json({
        error: 'Bad Request',
        message: '转录文本至少需要 10 个字符',
        statusCode: 400,
        timestamp: new Date(),
      });
      return;
    }

    // 将 AsyncGenerator 转换为 ReadableStream
    const generator = agent.streamAnalyze(prompt);
    const readableStream = new ReadableStream<string>({
      async pull(controller) {
        const { value, done } = await generator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });

    // 使用 LangChainAdapter 将流转换为 Vercel AI SDK 兼容的响应
    const response = LangChainAdapter.toDataStreamResponse(readableStream);

    // 复制响应头
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 设置状态码
    res.status(response.status);

    // 流式传输响应体
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        return pump();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : '分析过程中发生错误',
      statusCode: 500,
      timestamp: new Date(),
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
