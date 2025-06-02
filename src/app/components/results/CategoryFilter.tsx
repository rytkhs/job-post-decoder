/**
 * CategoryFilterコンポーネント
 * 解析結果のカテゴリ別フィルタリング機能を提供
 * アクティブ状態の視覚的表示とフィルター状態管理を含む
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Filter, X, Check } from 'lucide-react';
import { FindingCategory, EnhancedFinding } from '../../types/api';

/**
 * CategoryFilterコンポーネントのプロパティ
 */
interface CategoryFilterProps {
  /** 解析結果リスト */
  findings: EnhancedFinding[];
  /** 選択されたカテゴリ */
  selectedCategories: FindingCategory[];
  /** カテゴリ選択変更ハンドラー */
  onCategoryChange: (categories: FindingCategory[]) => void;
  /** コンパクト表示かどうか */
  compact?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * カテゴリ設定の定義
 */
const CATEGORY_CONFIG = {
  compensation: {
    label: '💰 給与・待遇',
    description: '給与、賞与、福利厚生に関する表現',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
  },
  worklife: {
    label: '⏰ 労働環境',
    description: '勤務時間、残業、働き方に関する表現',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
  },
  culture: {
    label: '🏢 企業文化',
    description: '職場環境、社風、人間関係に関する表現',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
  },
  growth: {
    label: '📈 成長機会',
    description: 'キャリア、スキルアップ、昇進に関する表現',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
  },
  other: {
    label: '📋 その他',
    description: 'その他の注意すべき表現',
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
  }
} as const;

/**
 * カテゴリ別の件数を計算する関数
 */
function getCategoryCounts(findings: EnhancedFinding[]): Record<FindingCategory, number> {
  const counts = {
    compensation: 0,
    worklife: 0,
    culture: 0,
    growth: 0,
    other: 0
  };

  findings.forEach(finding => {
    counts[finding.category]++;
  });

  return counts;
}

/**
 * 利用可能なカテゴリを取得する関数
 */
function getAvailableCategories(findings: EnhancedFinding[]): FindingCategory[] {
  const categories = new Set<FindingCategory>();
  findings.forEach(finding => {
    categories.add(finding.category);
  });
  return Array.from(categories);
}

/**
 * カテゴリフィルターコンポーネント
 */
export function CategoryFilter({
  findings,
  selectedCategories,
  onCategoryChange,
  compact = false,
  className = ''
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const categoryCounts = getCategoryCounts(findings);
  const availableCategories = getAvailableCategories(findings);

  /**
   * カテゴリ選択の切り替え
   */
  const toggleCategory = (category: FindingCategory) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    onCategoryChange(newCategories);
  };

  /**
   * 全選択/全解除の切り替え
   */
  const toggleAll = () => {
    if (selectedCategories.length === availableCategories.length) {
      onCategoryChange([]);
    } else {
      onCategoryChange(availableCategories);
    }
  };

  /**
   * フィルターのクリア
   */
  const clearFilters = () => {
    onCategoryChange(availableCategories);
  };

  const isAllSelected = selectedCategories.length === availableCategories.length;
  const hasActiveFilters = selectedCategories.length < availableCategories.length;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          フィルター
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>

        {isExpanded && (
          <div className="flex items-center gap-2">
            {availableCategories.map(category => {
              const config = CATEGORY_CONFIG[category];
              const count = categoryCounts[category];
              const isSelected = selectedCategories.includes(category);

              if (count === 0) return null;

              return (
                <Button
                  key={category}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className={`flex items-center gap-1 ${
                    isSelected ? '' : 'hover:' + config.color
                  }`}
                >
                  {config.label}
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                クリア
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            カテゴリフィルター
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="flex items-center gap-1"
            >
              {isAllSelected ? (
                <>
                  <X className="h-3 w-3" />
                  全解除
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  全選択
                </>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                リセット
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableCategories.map(category => {
            const config = CATEGORY_CONFIG[category];
            const count = categoryCounts[category];
            const isSelected = selectedCategories.includes(category);

            if (count === 0) return null;

            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                onClick={() => toggleCategory(category)}
                className={`
                  flex items-center justify-between p-4 h-auto text-left transition-all duration-200
                  ${isSelected
                    ? 'ring-2 ring-primary ring-offset-2'
                    : `hover:${config.color} hover:scale-105`
                  }
                `}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">
                    {config.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {config.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge
                    variant={isSelected ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {count}件
                  </Badge>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              {selectedCategories.length}個のカテゴリを表示中
              （全{availableCategories.length}カテゴリ中）
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * フィルター適用ロジック
 */
export function filterFindingsByCategory(
  findings: EnhancedFinding[],
  selectedCategories: FindingCategory[]
): EnhancedFinding[] {
  if (selectedCategories.length === 0) {
    return findings;
  }

  return findings.filter(finding =>
    selectedCategories.includes(finding.category)
  );
}

/**
 * カテゴリフィルター状態管理用のカスタムフック
 */
export function useCategoryFilter(findings: EnhancedFinding[]) {
  const availableCategories = getAvailableCategories(findings);
  const [selectedCategories, setSelectedCategories] = useState<FindingCategory[]>(() =>
    getAvailableCategories(findings)
  );

  // findingsが変更された時に利用可能なカテゴリを更新
  useEffect(() => {
    const newAvailableCategories = getAvailableCategories(findings);
    // 現在選択されているカテゴリのうち、利用可能なもののみを保持
    setSelectedCategories(prev => {
      const validCategories = prev.filter(cat => newAvailableCategories.includes(cat));
      // 新しいカテゴリがある場合は追加
      const missingCategories = newAvailableCategories.filter(cat => !validCategories.includes(cat));
      return [...validCategories, ...missingCategories];
    });
  }, [findings]); // findingsを直接監視

  const filteredFindings = filterFindingsByCategory(findings, selectedCategories);

  return {
    selectedCategories,
    setSelectedCategories,
    filteredFindings,
    availableCategories
  };
}
