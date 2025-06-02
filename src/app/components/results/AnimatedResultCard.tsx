/**
 * AnimatedResultCardコンポーネント
 * 解析結果カードの段階的表示アニメーションを提供
 * 重要度順での表示順序制御とスムーズな遷移効果を含む
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { SeverityBadge, getSeverityBackgroundColor } from './SeverityBadge';
import { FeedbackButton } from '../shared/FeedbackButton';
import { MessageSquare, Tag } from 'lucide-react';
import { EnhancedFinding, FeedbackType } from '../../types/api';

/**
 * AnimatedResultCardコンポーネントのプロパティ
 */
interface AnimatedResultCardProps {
  /** 解析結果データ */
  finding: EnhancedFinding;
  /** カードのインデックス（アニメーション遅延用） */
  index: number;
  /** 発見事項のID */
  findingId: string;
  /** フィードバック送信ハンドラー */
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  /** 初期フィードバック状態 */
  initialFeedback?: FeedbackType | null;
  /** アニメーション効果を有効にするかどうか */
  animated?: boolean;
  /** 表示遅延（ミリ秒） */
  delay?: number;
}

/**
 * カテゴリ名の日本語マッピング
 */
const CATEGORY_LABELS = {
  compensation: '💰 給与・待遇',
  worklife: '⏰ 労働環境',
  culture: '🏢 企業文化',
  growth: '📈 成長機会',
  other: '📋 その他'
} as const;

/**
 * アニメーション付き解析結果カードコンポーネント
 */
export function AnimatedResultCard({
  finding,
  index,
  findingId,
  onFeedback,
  initialFeedback,
  animated = true,
  delay
}: AnimatedResultCardProps) {
  const [isVisible, setIsVisible] = useState(!animated);
  const [isHovered, setIsHovered] = useState(false);

  // アニメーション遅延の計算
  const animationDelay = delay ?? (index * 150); // デフォルトは150ms間隔

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, animationDelay);

      return () => clearTimeout(timer);
    }
  }, [animated, animationDelay]);

  return (
    <Card
      className={`
        overflow-hidden transition-all duration-500 ease-out
        ${getSeverityBackgroundColor(finding.severity)}
        ${isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
        }
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-md'}
        ${animated ? 'transform' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transitionDelay: animated && !isVisible ? `${animationDelay}ms` : '0ms'
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={`
            text-lg font-medium flex-1 transition-colors duration-200
            ${isHovered ? 'text-primary' : ''}
          `}>
            "{finding.original_phrase}"
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SeverityBadge severity={finding.severity} />
            {finding.category && (
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[finding.category] || finding.category}
              </Badge>
            )}
          </div>
        </div>

        {/* 信頼度とキーワード */}
        {finding.confidence > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>信頼度: {Math.round(finding.confidence * 100)}%</span>
            {finding.related_keywords.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span>{finding.related_keywords.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {/* 本音の可能性セクション */}
        <div className={`
          transition-all duration-300 delay-100
          ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}>
          <h4 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
            🔍 本音の可能性
          </h4>
          <ul className="list-disc pl-5 space-y-2">
            {finding.potential_realities.map((reality, idx) => (
              <li
                key={idx}
                className={`
                  text-sm leading-relaxed transition-all duration-300
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                `}
                style={{
                  transitionDelay: animated ? `${animationDelay + 200 + (idx * 100)}ms` : '0ms'
                }}
              >
                {reality}
              </li>
            ))}
          </ul>
        </div>

        {/* 確認すべきポイントセクション */}
        <div className={`
          transition-all duration-300 delay-200
          ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}>
          <h4 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
            ✅ 確認すべきポイント
          </h4>
          <ul className="list-disc pl-5 space-y-2">
            {finding.points_to_check.map((point, idx) => (
              <li
                key={idx}
                className={`
                  text-sm leading-relaxed transition-all duration-300
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                `}
                style={{
                  transitionDelay: animated ? `${animationDelay + 400 + (idx * 100)}ms` : '0ms'
                }}
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* 面接質問例 */}
        {finding.suggested_questions.length > 0 && (
          <div className={`
            transition-all duration-300 delay-300
            ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
          `}>
            <h4 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              面接で使える質問例
            </h4>
            <ul className="list-disc pl-5 space-y-2">
              {finding.suggested_questions.map((question, idx) => (
                <li
                  key={idx}
                  className={`
                    text-sm leading-relaxed text-blue-700 dark:text-blue-300 transition-all duration-300
                    ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                  `}
                  style={{
                    transitionDelay: animated ? `${animationDelay + 600 + (idx * 100)}ms` : '0ms'
                  }}
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* フィードバックボタン */}
        <div className={`
          flex items-center justify-between pt-4 border-t transition-all duration-300 delay-500
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <span className="text-xs text-muted-foreground">この情報は役に立ちましたか？</span>
          <FeedbackButton
            findingId={findingId}
            onFeedback={onFeedback}
            initialFeedback={initialFeedback}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 結果カードリストコンポーネント
 * 重要度順でソートされたカードを段階的に表示
 */
interface AnimatedResultListProps {
  /** 解析結果リスト */
  findings: EnhancedFinding[];
  /** フィードバック送信ハンドラー */
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  /** フィードバック状態 */
  feedbackState: Record<string, FeedbackType>;
  /** アニメーション効果を有効にするかどうか */
  animated?: boolean;
  /** カード間の遅延間隔（ミリ秒） */
  staggerDelay?: number;
}

export function AnimatedResultList({
  findings,
  onFeedback,
  feedbackState,
  animated = true,
  staggerDelay = 150
}: AnimatedResultListProps) {
  return (
    <div className="space-y-4">
      {findings.map((finding, index) => {
        const findingId = `finding-${index}`;
        const currentFeedback = feedbackState[findingId];

        return (
          <AnimatedResultCard
            key={index}
            finding={finding}
            index={index}
            findingId={findingId}
            onFeedback={onFeedback}
            initialFeedback={currentFeedback}
            animated={animated}
            delay={index * staggerDelay}
          />
        );
      })}
    </div>
  );
}
