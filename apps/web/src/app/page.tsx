'use client';

import { useCompletion } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@interview-lens/ui';

export default function Home() {
  const { completion, input, setInput, handleSubmit, isLoading, error } = useCompletion({
    api: `${process.env.NEXT_PUBLIC_API_URL}/api/analyze`,
  });

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">InterviewLens</h1>
          <p className="text-gray-600">AI 驱动的面试录音智能分析工具</p>
        </div>

        {/* 输入区域 */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <label htmlFor="transcript" className="block text-lg font-medium text-gray-700 mb-3">
              面试转录文本
            </label>
            <textarea
              id="transcript"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请粘贴面试转录文本...&#10;&#10;例如：&#10;面试官：请介绍一下你自己。&#10;候选人：您好，我叫张三，有3年的前端开发经验..."
              className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 resize-y"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {input.length > 0 ? `已输入 ${input.length} 个字符` : '至少需要 10 个字符'}
              </span>
              <Button type="submit" disabled={isLoading || input.trim().length < 10}>
                {isLoading ? '分析中...' : '开始分析'}
              </Button>
            </div>
          </div>
        </form>

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">分析过程中发生错误：{error.message}</p>
          </div>
        )}

        {/* 分析结果展示区 */}
        {(completion || isLoading) && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              分析结果
              {isLoading && (
                <span className="inline-flex items-center">
                  <span className="animate-pulse text-blue-500">●</span>
                  <span className="text-sm text-gray-500 ml-2">正在分析...</span>
                </span>
              )}
            </h2>
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown>{completion || '等待分析结果...'}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        {!completion && !isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-3">使用说明</h3>
            <ul className="list-disc list-inside text-blue-700 space-y-2">
              <li>将面试录音的转录文本粘贴到上方输入框</li>
              <li>转录文本应包含面试官和候选人的对话内容</li>
              <li>AI 将从沟通能力、专业能力、软技能等维度进行分析</li>
              <li>分析结果将以流式方式实时展示</li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
