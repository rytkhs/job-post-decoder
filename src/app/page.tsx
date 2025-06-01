'use client';

import { useState } from 'react';
import { JobPostingForm } from './components/JobPostingForm';
import { DecodingResult } from './components/DecodingResult';

export default function Home() {
  // 状態管理
  const [jobPostingText, setJobPostingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decodingResult, setDecodingResult] = useState<any>(null);

  // フォーム送信処理（APIとの連携は後のフェーズで実装）
  const handleSubmit = (text: string) => {
    setJobPostingText(text);
    // 現時点では実際のAPI呼び出しは行わず、状態の更新のみ
    setIsLoading(false);
    setError(null);
    setDecodingResult(null);
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
