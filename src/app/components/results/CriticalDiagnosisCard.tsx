/**
 * CriticalDiagnosisCard コンポーネント
 * 辛口キャリアアドバイザーの診断結果を表示するカード
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  Users,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CriticalFinding, DangerLevel, FeedbackType } from '../../types/api';

interface CriticalDiagnosisCardProps {
  finding: CriticalFinding;
  index: number;
  onFeedback?: (findingId: string, feedback: FeedbackType) => void;
  feedbackState?: Record<string, FeedbackType>;
  animated?: boolean;
}

/**
 * 危険度レベルのアイコンと色を取得
 */
const getDangerLevelConfig = (level: DangerLevel) => {
  switch (level) {
    case '🔴':
      return {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: '高危険',
        emoji: '🔴'
      };
    case '🟡':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        label: '要注意',
        emoji: '🟡'
      };
    case '🟢':
      return {
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: '問題なし',
        emoji: '🟢'
      };
  }
};

export function CriticalDiagnosisCard({
  finding,
  index,
  onFeedback,
  feedbackState,
  animated = true
}: CriticalDiagnosisCardProps) {
  const config = getDangerLevelConfig(finding.danger_level);
  const Icon = config.icon;
  const findingId = `finding-${index}`;
  const currentFeedback = feedbackState?.[findingId];

  const cardContent = (
    <Card className={`${config.borderColor} ${config.bgColor} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                &ldquo;{finding.phrase}&rdquo;
              </CardTitle>
              <Badge variant="outline" className={`mt-1 ${config.color}`}>
                {config.emoji} {config.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 辛口一言診断 */}
        <div className={`p-3 rounded-lg ${config.bgColor} border-l-4 ${config.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className={`h-4 w-4 ${config.color}`} />
            <span className="font-medium text-sm text-muted-foreground">辛口診断</span>
          </div>
          <p className="text-sm font-medium text-foreground">{finding.one_line_diagnosis}</p>
        </div>

        {/* 裏の事情 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm text-muted-foreground">裏の事情</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6">
            {finding.hidden_reality}
          </p>
        </div>

        {/* 確認方法 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm text-muted-foreground">面接での確認方法</span>
          </div>
          <div className="pl-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.how_to_check}
            </p>
          </div>
        </div>

        {/* よくある事例 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm text-muted-foreground">よくある事例</span>
          </div>
          <div className={`p-3 rounded-lg bg-muted/50 border-l-4 border-muted`}>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;{finding.real_story}&rdquo;
            </p>
          </div>
        </div>

        {/* フィードバックボタン */}
        {onFeedback && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">この診断は参考になりましたか？</span>
            <div className="flex gap-1">
              <Button
                variant={currentFeedback === 'helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFeedback(findingId, 'helpful')}
                className="h-7 px-2"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant={currentFeedback === 'not-helpful' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFeedback(findingId, 'not-helpful')}
                className="h-7 px-2"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
