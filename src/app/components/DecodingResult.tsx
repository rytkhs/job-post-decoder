/**
 * DecodingResultコンポーネント
 * 求人票解析の結果を表示するコンポーネント
 * ローディング状態、エラー状態、および解析結果の表示を管理する
 */
'use client';

import React from 'react';

/**
 * LLMからの応答の型定義
 * @property {string} original_phrase - 求人票に記載されている元の表現
 * @property {string[]} potential_realities - その表現が示唆する可能性のある本音や実態
 * @property {string[]} points_to_check - 面接や入社前に確認すべきポイント
 */
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

/**
 * LLMからのレスポンスを表すインターフェース
 * @property {Finding[]} findings - 解析結果の配列
 */
interface LLMResponse {
  findings: Finding[];
}

/**
 * DecodingResultコンポーネントのプロパティ
 * @property {LLMResponse | null} result - 解析結果、まだ結果がない場合はnull
 * @property {boolean} isLoading - ローディング中かどうかを示すフラグ
 * @property {string | null} error - エラーメッセージ、エラーがない場合はnull
 */
interface DecodingResultProps {
  result: LLMResponse | null;
  isLoading: boolean;
  error: string | null;
}

import {
  AlertCircle, // エラーアイコン
  Loader2,      // ローディングアイコン
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from './ui/card';

/**
 * 求人票解析結果を表示するコンポーネント
 * @param {DecodingResultProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element | null} - レンダリングされるUI要素
 */
export function DecodingResult({ result, isLoading, error }: DecodingResultProps) {
  /**
   * ローディング状態の表示
   * APIリクエスト中にユーザーに表示されるローディングインジケーター
   */
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardContent className="flex flex-col items-center justify-center py-10">
          {/* ローディングアニメーションを表示 */}
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">求人票を解析しています...</p>
          <p className="text-center text-sm text-muted-foreground mt-2">しばらくお待ちください</p>
        </CardContent>
      </Card>
    );
  }

  /**
   * エラー状態の表示
   * APIリクエスト中にエラーが発生した場合に表示されるエラーメッセージ
   */
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 border-red-200 bg-red-50 dark:bg-red-900/10">
        <CardContent className="flex items-center pt-6">
          {/* エラーアイコンとメッセージを表示 */}
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  /**
   * 結果がない場合（初期状態）
   * ユーザーがまだ解析を実行していない場合は何も表示しない
   */
  if (!result || !result.findings) {
    return null;
  }
  
  /**
   * 解析結果が空の場合（注意すべき表現が見つからなかった場合）
   * AIが求人票に注意すべき表現を検出できなかった場合のメッセージ
   */
  if (result.findings.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">この求人票には特に注意すべき表現は見つかりませんでした。</p>
        </CardContent>
      </Card>
    );
  }

  /**
   * 解析結果の表示
   * 各注意すべき表現とその解釈、確認ポイントをカード形式で表示
   */
  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">解析結果</h2>
      <div className="space-y-6">
        {/* 各解析結果をカードとして表示 */}
        {result.findings.map((finding, index) => (
          <Card key={index} className="overflow-hidden">
            {/* 元の表現をカードヘッダーに表示 */}
            <CardHeader className="bg-muted/50 pb-3">
              <CardTitle className="text-lg font-medium">
                {finding.original_phrase}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
              {/* 本音の可能性セクション */}
              <div className="mb-6">
                <h4 className="font-medium text-sm text-primary mb-2">本音の可能性:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {finding.potential_realities.map((reality, idx) => (
                    <li key={idx} className="text-sm">{reality}</li>
                  ))}
                </ul>
              </div>
              
              {/* 確認すべきポイントセクション */}
              <div>
                <h4 className="font-medium text-sm text-primary mb-2">確認すべきポイント:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {finding.points_to_check.map((point, idx) => (
                    <li key={idx} className="text-sm">{point}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
