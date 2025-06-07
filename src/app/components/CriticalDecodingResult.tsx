/**
 * CriticalDecodingResult コンポーネント
 * 辛口キャリアアドバイザー診断の結果を表示するコンポーネント
 * 人間味のあるストーリー性重視の表示システム
 */
'use client';

import React, { useRef } from 'react';
import {
  AlertCircle,
  Loader2,
  Shield,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent
} from './ui/card';
import { CriticalSummaryCard } from './results/CriticalSummaryCard';
import { CriticalDiagnosisCard } from './results/CriticalDiagnosisCard';
import { CompactStepVisualizer } from './analysis/StepVisualizer';
import { useAppStore } from '../store/appStore';
import {
  CriticalAnalysisResponse,
  AnalysisProgress as AnalysisProgressType,
  FeedbackType
} from '../types/api';

/**
 * CriticalDecodingResult コンポーネントのプロパティ
 */
interface CriticalDecodingResultProps {
  result: CriticalAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  /** 解析進捗情報（オプション） */
  analysisProgress?: AnalysisProgressType;
}

/**
 * 辛口診断結果を表示するコンポーネント
 */
export function CriticalDecodingResult({
  result,
  isLoading,
  error,
  analysisProgress
}: CriticalDecodingResultProps) {
  // Zustandストアから状態とアクションを取得
  const {
    enableAnimations,
    feedbackHistory,
    setFeedback
  } = useAppStore();

  // アクセシビリティ用のref
  const mainContentRef = useRef<HTMLDivElement>(null);

  /**
   * フィードバック処理
   */
  const handleFeedback = (findingId: string, feedback: FeedbackType) => {
    setFeedback(findingId, feedback);
  };

  /**
   * ローディング状態の表示
   */
  if (isLoading) {
    // 解析進捗情報がある場合は詳細な進捗を表示
    if (analysisProgress) {
      return (
        <Card className="w-full max-w-4xl mx-auto mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center gap-4 mb-6">
              <Shield className="h-8 w-8 text-red-500" />
              <Loader2 className="h-8 w-8 animate-spin text-red-500" aria-hidden="true" />
              <Search className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">ブラック求人をチェック中...</h3>
            <p className="text-center text-muted-foreground mb-4" aria-live="polite">
              {analysisProgress.message}
            </p>
            <CompactStepVisualizer currentStep={analysisProgress.currentStep} />
            <p className="text-sm text-muted-foreground mt-4">
              企業の甘い言葉に騙されないよう、しっかりと分析しています
            </p>
          </CardContent>
        </Card>
      );
    }

    // 従来のローディング表示
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8" role="status" aria-live="polite">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">辛口診断中...</h3>
          <p className="text-center text-muted-foreground mb-2">
            求人票の裏にある本音を読み解いています...
          </p>
          <p className="text-center text-sm text-muted-foreground">
            企業の甘い言葉に騙されないよう、しっかりと分析しています
          </p>
        </CardContent>
      </Card>
    );
  }

  /**
   * エラー状態の表示
   */
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8 border-red-200 bg-red-50 dark:bg-red-900/10" role="alert">
        <CardContent className="flex items-center pt-6">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" aria-hidden="true" />
          <div>
            <p className="text-red-600 dark:text-red-400 font-medium">診断エラー</p>
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * 結果がない場合（初期状態）
   */
  if (!result) {
    return null;
  }

  /**
   * 解析結果が空の場合
   */
  if (result.key_findings.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8" role="status">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
              優良求人の可能性が高いです！
            </h3>
            <p className="text-muted-foreground">
              この求人票には特に注意すべき表現は見つかりませんでした。
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ただし、面接では一般的な確認事項について質問することをお勧めします。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * 辛口診断結果の表示
   */
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-8" ref={mainContentRef} role="main">
      {/* サマリーカード */}
      <CriticalSummaryCard
        analysis={result}
        animated={enableAnimations}
      />

      {/* 個別診断結果 */}
      {result.key_findings.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              🔍 個別診断結果
            </h2>
            <div className="text-sm text-muted-foreground" aria-live="polite">
              {result.key_findings.length}件の要注意表現を検出
            </div>
          </div>

          {/* 注意喚起メッセージ */}
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  以下の診断は、求人票の表現から推測される可能性を示しています
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  実際の企業の状況は面接で直接確認することをお勧めします
                </p>
              </div>
            </div>
          </div>

          {/* 診断カード一覧 */}
          <div className="space-y-6">
            {result.key_findings.map((finding, index) => (
              <CriticalDiagnosisCard
                key={`finding-${index}`}
                finding={finding}
                index={index}
                onFeedback={handleFeedback}
                feedbackState={feedbackHistory}
                animated={enableAnimations}
              />
            ))}
          </div>
        </div>
      )}

      {/* フッター免責事項 */}
      <div className="mt-12 p-6 rounded-lg bg-muted/50 border">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          免責事項
        </h4>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            本診断結果は、AIによる求人票の表現分析に基づく推測であり、実際の企業の状況を保証するものではありません。
          </p>
          <p>
            転職活動においては、面接や企業研究を通じてご自身で十分に確認いただき、最終的な判断はご自身で行ってください。
          </p>
        </div>
      </div>
    </div>
  );
}
