import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
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

// Stream chat endpoint (placeholder for future implementation)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const validatedRequest = ChatRequestSchema.parse(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await agent.run(validatedRequest.message);

    res.write(`data: ${JSON.stringify({ type: 'token', data: response })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'end', data: '' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
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
