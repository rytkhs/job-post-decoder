/**
 * AnalysisProgressコンポーネント
 * 求人票解析の進捗状況を視覚的に表示するコンポーネント
 * プログレスバー、ステップ表示、推定残り時間を提供
 */
'use client';

import React from 'react';
import { Progress } from '../ui/progress';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { AnalysisProgress as AnalysisProgressType } from '../../types/api';

/**
 * AnalysisProgressコンポーネントのプロパティ
 */
interface AnalysisProgressProps {
  /** 現在の進捗情報 */
  progress: AnalysisProgressType;
  /** アニメーション効果を有効にするかどうか */
  animated?: boolean;
}

/**
 * 解析ステップの定義
 */
const ANALYSIS_STEPS = [
  {
    id: 'input',
    label: '入力確認',
    description: '求人票テキストを確認しています',
    icon: CheckCircle,
    duration: 1
  },
  {
    id: 'analyzing',
    label: 'AI解析実行',
    description: '求人票を詳細に分析しています',
    icon: Loader2,
    duration: 8
  },
  {
    id: 'results',
    label: '結果整理',
    description: '解析結果を整理しています',
    icon: Loader2,
    duration: 2
  },
  {
    id: 'insights',
    label: '完了',
    description: '解析が完了しました',
    icon: CheckCircle,
    duration: 0
  }
] as const;

/**
 * 時間をフォーマットする関数
 * @param seconds 秒数
 * @returns フォーマットされた時間文字列
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}秒`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}分${remainingSeconds}秒`;
}

/**
 * 解析進捗表示コンポーネント
 */
export function AnalysisProgress({ progress, animated = true }: AnalysisProgressProps) {
  const currentStepIndex = ANALYSIS_STEPS.findIndex(step => step.id === progress.currentStep);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        {/* ヘッダー部分 */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">求人票を解析中です</h3>
          <p className="text-muted-foreground">{progress.message}</p>
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">進捗状況</span>
            <span className="text-sm text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress
            value={progress.progress}
            className={`h-2 ${animated ? 'transition-all duration-500 ease-out' : ''}`}
          />
        </div>

        {/* ステップ表示 */}
        <div className="space-y-4 mb-6">
          {ANALYSIS_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            const IconComponent = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  isCurrent
                    ? 'bg-primary/10 border border-primary/20'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-muted/50'
                }`}
              >
                {/* アイコン */}
                <div className={`flex-shrink-0 ${
                  isCurrent
                    ? 'text-primary'
                    : isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Loader2 className={`h-5 w-5 ${animated ? 'animate-spin' : ''}`} />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* ステップ情報 */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {step.description}
                  </div>
                </div>

                {/* ステータス表示 */}
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {isCompleted && '完了'}
                  {isCurrent && '実行中'}
                  {isPending && '待機中'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 推定残り時間 */}
        {progress.estimatedTime > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>推定残り時間: {formatTime(progress.estimatedTime)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
