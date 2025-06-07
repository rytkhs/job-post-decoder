/**
 * CriticalSummaryCard コンポーネント
 * 辛口診断の全体サマリーを表示するカード
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Flag,
  MessageSquare
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../ui/card';
import { Badge } from '../ui/badge';
import { CriticalAnalysisResponse } from '../../types/api';

interface CriticalSummaryCardProps {
  analysis: CriticalAnalysisResponse;
  animated?: boolean;
}

/**
 * 推奨アクションのスタイル設定
 */
const getRecommendationConfig = (recommendation: CriticalAnalysisResponse['recommendation']) => {
  switch (recommendation) {
    case 'apply':
      return {
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: '積極的に応募',
        emoji: '✅'
      };
    case 'caution':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        label: '慎重に検討',
        emoji: '⚠️'
      };
    case 'avoid':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: '見送り推奨',
        emoji: '❌'
      };
  }
};

export function CriticalSummaryCard({ analysis, animated = true }: CriticalSummaryCardProps) {
  const recommendationConfig = getRecommendationConfig(analysis.recommendation);
  const RecommendationIcon = recommendationConfig.icon;

  const cardContent = (
    <Card className="overflow-hidden border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6 text-primary" />
          辛口診断結果
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* 全体診断 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-lg">総合診断</span>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
            <p className="text-base font-medium">{analysis.overall_diagnosis}</p>
          </div>
        </div>

        {/* 危険度統計 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">危険度統計</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {analysis.danger_stats.high_risk_count}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">🔴 高危険</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analysis.danger_stats.medium_risk_count}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">🟡 要注意</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.danger_stats.low_risk_count}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">🟢 問題なし</div>
            </div>
          </div>
        </div>

        {/* 推奨アクション */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">推奨アクション</span>
          </div>
          <div className={`p-4 rounded-lg ${recommendationConfig.bgColor} border ${recommendationConfig.borderColor}`}>
            <div className="flex items-center gap-3 mb-2">
              <RecommendationIcon className={`h-5 w-5 ${recommendationConfig.color}`} />
              <Badge variant="outline" className={`${recommendationConfig.color} font-medium`}>
                {recommendationConfig.emoji} {recommendationConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* レッドフラッグサマリー */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">要注意ポイント</span>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.red_flags_summary}
            </p>
          </div>
        </div>

        {/* 面接戦略 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">面接戦略</span>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
              💡 {analysis.interview_strategy}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
