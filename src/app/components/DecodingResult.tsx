import React from 'react';

// LLMからの応答の型定義
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

interface LLMResponse {
  findings: Finding[];
}

interface DecodingResultProps {
  result: LLMResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function DecodingResult({ result, isLoading, error }: DecodingResultProps) {
  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 p-4 border rounded-md">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400">解析中です...</p>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 p-4 border border-red-300 bg-red-50 dark:bg-red-900/10 rounded-md">
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
      </div>
    );
  }

  // 結果がない場合
  if (!result || !result.findings || result.findings.length === 0) {
    return null;
  }

  // 結果の表示
  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">解析結果:</h2>
      <div className="space-y-4">
        {result.findings.map((finding, index) => (
          <div key={index} className="border rounded-md p-4 bg-white dark:bg-gray-800 shadow-sm">
            <h3 className="font-medium text-lg mb-2">元の表現: {finding.original_phrase}</h3>
            
            <div className="mb-3">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">本音の可能性:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {finding.potential_realities.map((reality, idx) => (
                  <li key={idx} className="text-sm">{reality}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">確認すべきポイント:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {finding.points_to_check.map((point, idx) => (
                  <li key={idx} className="text-sm">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
