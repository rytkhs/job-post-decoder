/**
 * SeverityBadge コンポーネント
 * 重要度に応じた色分けとアイコンを表示するバッジコンポーネント
 * パフォーマンス最適化：React.memo適用
 */
'use client';

import React, { memo } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { SeverityLevel } from '../../types/api';

/**
 * SeverityBadgeコンポーネントのプロパティ
 */
interface SeverityBadgeProps {
  /** 重要度レベル */
  severity: SeverityLevel;
  /** バッジのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** 追加のCSSクラス */
  className?: string;
  /** アイコンを表示するかどうか */
  showIcon?: boolean;
}

/**
 * 重要度レベルの設定
 */
const SEVERITY_CONFIG = {
  high: {
    label: '要注意',
    title: '高い注意が必要',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    backgroundClassName: 'border-red-100 bg-red-50/30 hover:bg-red-50/50 dark:border-red-900/20 dark:bg-red-900/10 dark:hover:bg-red-900/15'
  },
  medium: {
    label: '注意',
    title: '中程度の注意が必要',
    icon: AlertCircle,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    backgroundClassName: 'border-yellow-100 bg-yellow-50/30 hover:bg-yellow-50/50 dark:border-yellow-900/20 dark:bg-yellow-900/10 dark:hover:bg-yellow-900/15'
  },
  low: {
    label: '軽微',
    title: '軽微な注意点',
    icon: Info,
    variant: 'outline' as const,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    backgroundClassName: 'border-green-100 bg-green-50/30 hover:bg-green-50/50 dark:border-green-900/20 dark:bg-green-900/10 dark:hover:bg-green-900/15'
  }
} as const;

/**
 * サイズ別のスタイル設定
 */
const SIZE_CONFIG = {
  sm: {
    className: 'text-xs px-2 py-1',
    iconSize: 'h-3 w-3'
  },
  md: {
    className: 'text-sm px-3 py-1',
    iconSize: 'h-4 w-4'
  },
  lg: {
    className: 'text-base px-4 py-2',
    iconSize: 'h-5 w-5'
  }
} as const;

/**
 * 重要度の順序を取得する関数（ソート用）
 * @param severity - 重要度レベル
 * @returns 順序値（高いほど重要）
 */
export function getSeverityOrder(severity: SeverityLevel): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

/**
 * 重要度バッジコンポーネント
 */
export const SeverityBadge = memo<SeverityBadgeProps>(function SeverityBadge({
  severity,
  size = 'sm',
  className = '',
  showIcon = true
}) {
  const config = SEVERITY_CONFIG[severity];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeConfig.className} inline-flex items-center gap-1 font-medium ${className}`}
      title={config.title}
    >
      {showIcon && <IconComponent className={sizeConfig.iconSize} />}
      {config.label}
    </Badge>
  );
});

/**
 * 重要度レベルの色を取得する関数
 * @param severity - 重要度レベル
 * @returns Tailwind CSSの色クラス
 */
export function getSeverityColor(severity: SeverityLevel): string {
  return SEVERITY_CONFIG[severity].className;
}

/**
 * 重要度レベルのテキスト色を取得する関数
 * @param severity - 重要度レベル
 * @returns Tailwind CSSのテキスト色クラス
 */
export function getSeverityTextColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'high':
      return 'text-red-600 dark:text-red-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * 重要度レベルの背景色を取得する関数（カード用）
 * @param severity - 重要度レベル
 * @returns Tailwind CSSの背景色クラス
 */
export function getSeverityBackgroundColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'high':
      return 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800';
    case 'low':
      return 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800';
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-900/10 dark:border-gray-800';
  }
}

/**
 * 重要度レベルのラベルを取得する関数
 * @param severity - 重要度レベル
 * @returns 日本語ラベル
 */
export function getSeverityLabel(severity: SeverityLevel): string {
  return SEVERITY_CONFIG[severity].label;
}
