/**
 * StepVisualizerコンポーネント
 * 解析ステップの詳細な可視化を提供するコンポーネント
 * チェックマークアニメーション、ステップ間の遷移効果を含む
 */
'use client';

import React from 'react';
import { CheckCircle, Circle, Loader2, ArrowRight } from 'lucide-react';
import { AnalysisStep } from '../../types/api';

/**
 * StepVisualizerコンポーネントのプロパティ
 */
interface StepVisualizerProps {
  /** 現在のステップ */
  currentStep: AnalysisStep;
  /** アニメーション効果を有効にするかどうか */
  animated?: boolean;
  /** 縦向きレイアウトかどうか */
  vertical?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * ステップ定義
 */
const STEPS = [
  {
    id: 'input' as const,
    label: '入力確認',
    description: '求人票テキストの検証',
    color: 'blue'
  },
  {
    id: 'analyzing' as const,
    label: 'AI解析',
    description: '詳細な分析実行',
    color: 'purple'
  },
  {
    id: 'results' as const,
    label: '結果整理',
    description: 'データの構造化',
    color: 'orange'
  },
  {
    id: 'insights' as const,
    label: '完了',
    description: '解析完了',
    color: 'green'
  }
] as const;

/**
 * ステップの状態を取得する関数
 */
function getStepStatus(stepId: AnalysisStep, currentStep: AnalysisStep): 'completed' | 'current' | 'pending' {
  const stepIndex = STEPS.findIndex(step => step.id === stepId);
  const currentIndex = STEPS.findIndex(step => step.id === currentStep);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

/**
 * ステップアイコンコンポーネント
 */
function StepIcon({
  status,
  color,
  animated = true
}: {
  status: 'completed' | 'current' | 'pending';
  color: string;
  animated?: boolean;
}) {
  const baseClasses = "h-6 w-6 transition-all duration-300";

  switch (status) {
    case 'completed':
      return (
        <CheckCircle
          className={`${baseClasses} text-green-600 dark:text-green-400 ${
            animated ? 'animate-in zoom-in duration-300' : ''
          }`}
        />
      );
    case 'current':
      return (
        <Loader2
          className={`${baseClasses} text-${color}-600 dark:text-${color}-400 ${
            animated ? 'animate-spin' : ''
          }`}
        />
      );
    case 'pending':
      return (
        <Circle
          className={`${baseClasses} text-muted-foreground/50`}
        />
      );
  }
}

/**
 * ステップ接続線コンポーネント
 */
function StepConnector({
  isCompleted,
  vertical = false,
  animated = true
}: {
  isCompleted: boolean;
  vertical?: boolean;
  animated?: boolean;
}) {
  const baseClasses = vertical
    ? "w-0.5 h-8 mx-auto transition-all duration-500"
    : "h-0.5 flex-1 transition-all duration-500";

  return (
    <div className={`${baseClasses} ${
      isCompleted
        ? 'bg-green-600 dark:bg-green-400'
        : 'bg-muted-foreground/20'
    } ${animated && isCompleted ? 'animate-in slide-in-from-left duration-500' : ''}`} />
  );
}

/**
 * 解析ステップ可視化コンポーネント
 */
export function StepVisualizer({
  currentStep,
  animated = true,
  vertical = false,
  className = ''
}: StepVisualizerProps) {
  return (
    <div className={`${
      vertical
        ? 'flex flex-col items-center space-y-2'
        : 'flex items-center space-x-4'
    } ${className}`}>
      {STEPS.map((step) => {
        const status = getStepStatus(step.id, currentStep);
        const isLast = step.id === STEPS[STEPS.length - 1].id;

        return (
          <React.Fragment key={step.id}>
            {/* ステップ要素 */}
            <div className={`flex ${
              vertical ? 'flex-col items-center text-center' : 'items-center space-x-3'
            } ${status === 'current' ? 'scale-105' : ''} transition-transform duration-300`}>
              {/* アイコン */}
              <div className="flex-shrink-0">
                <StepIcon
                  status={status}
                  color={step.color}
                  animated={animated}
                />
              </div>

              {/* ラベルと説明 */}
              <div className={`${vertical ? 'mt-2' : ''}`}>
                <div className={`font-medium text-sm ${
                  status === 'completed'
                    ? 'text-green-600 dark:text-green-400'
                    : status === 'current'
                    ? `text-${step.color}-600 dark:text-${step.color}-400`
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>

            {/* 接続線（最後のステップ以外） */}
            {!isLast && (
              <div className={vertical ? 'my-2' : 'flex-1 flex items-center'}>
                {vertical ? (
                  <StepConnector
                    isCompleted={status === 'completed'}
                    vertical={true}
                    animated={animated}
                  />
                ) : (
                  <>
                    <StepConnector
                      isCompleted={status === 'completed'}
                      animated={animated}
                    />
                    <ArrowRight className={`h-4 w-4 mx-2 ${
                      status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground/50'
                    } transition-colors duration-300`} />
                  </>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * コンパクト版ステップビジュアライザー
 */
export function CompactStepVisualizer({
  currentStep,
  animated = true,
  className = ''
}: Omit<StepVisualizerProps, 'vertical'>) {
  const currentIndex = STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* プログレスドット */}
      <div className="flex space-x-1">
        {STEPS.map((step) => {
          const status = getStepStatus(step.id, currentStep);

          return (
            <div
              key={step.id}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                status === 'completed'
                  ? 'bg-green-600 dark:bg-green-400'
                  : status === 'current'
                  ? `bg-${step.color}-600 dark:bg-${step.color}-400 ${animated ? 'animate-pulse' : ''}`
                  : 'bg-muted-foreground/30'
              }`}
            />
          );
        })}
      </div>

      {/* 現在のステップ名 */}
      <div className="text-sm font-medium">
        {STEPS[currentIndex]?.label || '不明'}
      </div>

      {/* 進捗率 */}
      <div className="text-xs text-muted-foreground">
        ({Math.round(progress)}%)
      </div>
    </div>
  );
}
