import { z } from 'zod';

// Agent Message Types
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  timestamp: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

// Agent Response
export const AgentResponseSchema = z.object({
  id: z.string(),
  message: z.string(),
  role: MessageRoleSchema,
  metadata: z
    .object({
      thinking: z.string().optional(),
      toolCalls: z.array(z.string()).optional(),
      confidence: z.number().optional(),
    })
    .optional(),
  timestamp: z.date(),
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Agent State
export const AgentStateSchema = z.object({
  messages: z.array(MessageSchema),
  currentStep: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type AgentState = z.infer<typeof AgentStateSchema>;

// Chat Request/Response
export const ChatRequestSchema = z.object({
  message: z.string(),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  stream: z.boolean().optional().default(false),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  response: z.string(),
  conversationId: z.string(),
  messageId: z.string(),
  timestamp: z.date(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Stream Events
export const StreamEventSchema = z.object({
  type: z.enum(['start', 'token', 'end', 'error']),
  data: z.string(),
  messageId: z.string().optional(),
});
export type StreamEvent = z.infer<typeof StreamEventSchema>;

// Error Types
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
  timestamp: z.date(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Interview Analysis Types
export const AnalyzeRequestSchema = z.object({
  transcript: z.string().min(10, '转录文本至少需要 10 个字符'),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
