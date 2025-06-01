'use client';

import { useState } from 'react';
import { JobPostingForm } from './components/JobPostingForm';
import { DecodingResult } from './components/DecodingResult';

// 型定義
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

interface LLMResponse {
  findings: Finding[];
}

export default function Home() {
  // 状態管理
  const [jobPostingText, setJobPostingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decodingResult, setDecodingResult] = useState<LLMResponse | null>(null);

  // フォーム送信処理
  const handleSubmit = async (text: string) => {
    setJobPostingText(text);
    setIsLoading(true);
    setError(null);
    setDecodingResult(null);
    
    try {
      // APIリクエスト
      const response = await fetch('/api/decode-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      // レスポンスの処理
      const data = await response.json();
      
      if (!response.ok) {
        // エラーレスポンスの処理
        throw new Error(data.error || 'デコードに失敗しました。');
      }
      
      // 成功レスポンスの処理
      setDecodingResult(data);
    } catch (err) {
      // エラーハンドリング
      console.error('Error decoding job posting:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xl font-semibold mb-4 text-center">求人票のテキストを入力</h2>
        <JobPostingForm onSubmit={handleSubmit} isLoading={isLoading} />
      </section>
      
      <DecodingResult 
        result={decodingResult} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
}
