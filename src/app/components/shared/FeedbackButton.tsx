/**
 * FeedbackButton コンポーネント
 * 解析結果に対するユーザーフィードバックを収集するボタンコンポーネント
 * パフォーマンス最適化：React.memo、useMemo、useCallback適用
 */
'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { FeedbackType } from '../../types/api';

/**
 * FeedbackButtonコンポーネントのプロパティ
 */
interface FeedbackButtonProps {
  /** 発見事項のID */
  findingId: string;
  /** 現在のフィードバック状態 */
  currentFeedback?: FeedbackType | null;
  /** フィードバック送信時のコールバック */
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  /** ボタンサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 無効化フラグ */
  disabled?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * フィードバックタイプの設定
 */
const FEEDBACK_CONFIG = {
  helpful: {
    icon: ThumbsUp,
    label: '役に立った',
    activeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300',
    hoverClass: 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/10'
  },
  'not-helpful': {
    icon: ThumbsDown,
    label: '役に立たなかった',
    activeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300',
    hoverClass: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10'
  }
} as const;

/**
 * サイズ設定
 */
const SIZE_CONFIG = {
  sm: {
    button: 'h-7 px-2 text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    button: 'h-8 px-3 text-sm',
    icon: 'h-4 w-4'
  },
  lg: {
    button: 'h-10 px-4 text-base',
    icon: 'h-5 w-5'
  }
} as const;

/**
 * ローカルストレージキーの生成
 */
function getFeedbackStorageKey(findingId: string): string {
  return `feedback_${findingId}`;
}

/**
 * フィードバックをローカルストレージに保存
 */
export function saveFeedbackToStorage(findingId: string, feedback: FeedbackType): void {
  try {
    const key = getFeedbackStorageKey(findingId);
    const data = {
      feedback,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save feedback to localStorage:', error);
  }
}

/**
 * ローカルストレージからフィードバックを読み込み
 */
export function loadFeedbackFromStorage(findingId: string): FeedbackType | null {
  try {
    const key = getFeedbackStorageKey(findingId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      return data.feedback;
    }
  } catch (error) {
    console.warn('Failed to load feedback from localStorage:', error);
  }
  return null;
}

/**
 * フィードバックボタンコンポーネント
 */
export const FeedbackButton = memo<FeedbackButtonProps>(function FeedbackButton({
  findingId,
  currentFeedback = null,
  onFeedback,
  size = 'sm',
  disabled = false,
  className = ''
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // サイズ設定をメモ化
  const sizeConfig = useMemo(() => SIZE_CONFIG[size], [size]);

  // フィードバック送信ハンドラーをメモ化
  const handleFeedback = useCallback(async (feedback: FeedbackType) => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // フィードバックを送信
      onFeedback(findingId, feedback);

      // 確認メッセージを表示
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [findingId, onFeedback, disabled, isSubmitting]);

  // 確認メッセージの表示
  if (showConfirmation) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm ${className}`}>
        <Check className="h-4 w-4" />
        <span>フィードバックありがとうございます</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {(Object.keys(FEEDBACK_CONFIG) as FeedbackType[]).map((feedbackType) => {
        const config = FEEDBACK_CONFIG[feedbackType];
        const IconComponent = config.icon;
        const isActive = currentFeedback === feedbackType;
        const isOtherActive = currentFeedback && currentFeedback !== feedbackType;

        return (
          <Button
            key={feedbackType}
            variant="outline"
            size="sm"
            disabled={disabled || isSubmitting}
            onClick={() => handleFeedback(feedbackType)}
            className={`
              ${sizeConfig.button}
              ${isActive ? config.activeClass : ''}
              ${!isActive && !isOtherActive ? config.hoverClass : ''}
              ${isOtherActive ? 'opacity-50' : ''}
              transition-all duration-200
            `}
            title={config.label}
          >
            <IconComponent className={sizeConfig.icon} />
            <span className="sr-only">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
});

/**
 * フィードバック統計を取得する関数
 */
export function getFeedbackStats(): { helpful: number; notHelpful: number } {
  let helpful = 0;
  let notHelpful = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('feedback_')) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.feedback === 'helpful') {
            helpful++;
          } else if (data.feedback === 'not-helpful') {
            notHelpful++;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get feedback stats:', error);
  }

  return { helpful, notHelpful };
}

/**
 * すべてのフィードバックをクリアする関数
 */
export function clearAllFeedback(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('feedback_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear feedback:', error);
  }
}
