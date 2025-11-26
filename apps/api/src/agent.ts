import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// InterviewLens - AI-powered interview replay and analysis

// 初始化 LLM
const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// 系统提示词
const systemPrompt = `你是一个专业的 AI 助手，擅长帮助用户解答问题。
请用清晰、专业的语言回答用户的问题。`;

// 创建提示模板
const prompt = ChatPromptTemplate.fromMessages([
  ['system', systemPrompt],
  ['human', '{input}'],
]);

// 输出解析器
const outputParser = new StringOutputParser();

// 创建 LangChain 链
const chain = RunnableSequence.from([prompt, llm, outputParser]);

// 运行 Agent 的辅助函数
export async function runAgent(userMessage: string): Promise<string> {
  const result = await chain.invoke({
    input: userMessage,
  });

  return result;
}

// 导出链，方便扩展使用
export { chain };
