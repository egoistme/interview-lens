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

// 通用聊天系统提示词
const chatSystemPrompt = `你是一个专业的 AI 助手，擅长帮助用户解答问题。
请用清晰、专业的语言回答用户的问题。`;

// 面试分析系统提示词
const interviewAnalysisPrompt = `你是一位专业的面试分析师，擅长从面试录音转录文本中提取关键信息并提供深度分析。

请按以下结构分析面试转录文本：

## 1. 面试概览
- 面试类型判断（技术面/行为面/HR面等）
- 参与者识别

## 2. 候选人表现分析
- **沟通能力**：表达清晰度、逻辑性
- **专业能力**：技术深度、问题解决思路
- **软技能**：团队协作、学习态度

## 3. 关键问答回顾
列出 3-5 个最重要的问答，并评估回答质量

## 4. 优势与待改进
- 亮点：突出的优势表现
- 建议：可以改进的方面

## 5. 综合评估
给出 1-10 分的综合评分，并说明理由

请用专业、客观的语言进行分析，确保分析具有可操作性。`;

// 创建聊天提示模板
const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', chatSystemPrompt],
  ['human', '{input}'],
]);

// 创建面试分析提示模板
const analysisPrompt = ChatPromptTemplate.fromMessages([
  ['system', interviewAnalysisPrompt],
  ['human', '请分析以下面试转录文本：\n\n{input}'],
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

  const chatChain = RunnableSequence.from([chatPrompt, llm, outputParser]);
  const analysisChain = RunnableSequence.from([analysisPrompt, llm, outputParser]);

  return {
    // 普通聊天（同步）
    run: async (message: string): Promise<string> => {
      return chatChain.invoke({ input: message });
    },

    // 面试分析（流式）
    streamAnalyze: async function* (transcript: string) {
      const stream = await analysisChain.stream({ input: transcript });
      for await (const chunk of stream) {
        yield chunk;
      }
    },

    chatChain,
    analysisChain,
  };
}
