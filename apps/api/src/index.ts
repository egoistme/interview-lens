import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatRequestSchema, ChatResponseSchema } from '@interview-lens/shared-types';
import { runAgent } from './agent';

// Load environment variables
dotenv.config();

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
    // Validate request
    const validatedRequest = ChatRequestSchema.parse(req.body);

    // Run agent
    const response = await runAgent(validatedRequest.message);

    // Create response
    const chatResponse = {
      response,
      conversationId: validatedRequest.conversationId || `conv_${Date.now()}`,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date(),
    };

    // Validate response
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

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // For now, just send a simple response
    const response = await runAgent(validatedRequest.message);

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
