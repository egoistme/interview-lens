import { ChatZhipuAI } from '@langchain/community/chat_models/zhipuai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// InterviewLens - AI-powered interview replay and analysis

interface AgentConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

// 系统提示词
const systemPrompt = `你是一个专业的 AI 助手，擅长帮助用户解答问题。
请用清晰、专业的语言回答用户的问题。`;

// 创建提示模板
const prompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
]);

const outputParser = new StringOutputParser();

/**
 * 创建 Agent 实例
 */
export function createAgent(config: AgentConfig) {
  const llm = new ChatZhipuAI({
    model: config.model ?? 'glm-4-flash',
    temperature: config.temperature ?? 0.7,
    apiKey: config.apiKey,
  });

  const chain = RunnableSequence.from([prompt, llm, outputParser]);

  return {
    run: async (message: string): Promise<string> => {
      return chain.invoke({ input: message });
    },
    chain,
  };
}
