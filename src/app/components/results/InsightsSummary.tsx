/**
 * InsightsSummaryコンポーネント
 * 解析結果の総合的なサマリーダッシュボードを提供
 * 全体的なリスクレベル、カテゴリ分析、推奨事項を表示
 */
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SeverityBadge, getSeverityOrder } from './SeverityBadge';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Lightbulb,
  Shield,
  Users,
  Clock,
  DollarSign,
  Building
} from 'lucide-react';
import {
  EnhancedAPIResponse,
  EnhancedFinding,
  FindingCategory,
  Severity
} from '../../types/api';

/**
 * InsightsSummaryコンポーネントのプロパティ
 */
interface InsightsSummaryProps {
  /** 解析結果データ */
  analysisResult: EnhancedAPIResponse;
  /** 解析結果の詳細リスト */
  findings: EnhancedFinding[];
  /** カスタムクラス名 */
  className?: string;
}

/**
 * カテゴリ設定とアイコン
 */
const CATEGORY_CONFIG = {
  compensation: {
    label: '💰 給与・待遇',
    icon: DollarSign,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    description: '給与、賞与、福利厚生に関する懸念'
  },
  worklife: {
    label: '⏰ 労働環境',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    description: '勤務時間、残業、働き方に関する懸念'
  },
  culture: {
    label: '🏢 企業文化',
    icon: Building,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    description: '職場環境、社風、人間関係に関する懸念'
  },
  growth: {
    label: '📈 成長機会',
    icon: TrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    description: 'キャリア、スキルアップ、昇進に関する懸念'
  },
  other: {
    label: '📋 その他',
    icon: Target,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    description: 'その他の注意すべき表現'
  }
} as const;

/**
 * 重要度レベルの設定
 */
const SEVERITY_CONFIG = {
  high: {
    label: '高リスク',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    icon: AlertTriangle
  },
  medium: {
    label: '中リスク',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: AlertTriangle
  },
  low: {
    label: '低リスク',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    icon: CheckCircle
  }
} as const;

/**
 * カテゴリ別統計を計算
 */
function calculateCategoryStats(findings: EnhancedFinding[]) {
  const stats: Record<FindingCategory, { count: number; severities: Record<Severity, number> }> = {
    compensation: { count: 0, severities: { high: 0, medium: 0, low: 0 } },
    worklife: { count: 0, severities: { high: 0, medium: 0, low: 0 } },
    culture: { count: 0, severities: { high: 0, medium: 0, low: 0 } },
    growth: { count: 0, severities: { high: 0, medium: 0, low: 0 } },
    other: { count: 0, severities: { high: 0, medium: 0, low: 0 } }
  };

  findings.forEach(finding => {
    stats[finding.category].count++;
    stats[finding.category].severities[finding.severity]++;
  });

  return stats;
}

/**
 * 重要度別統計を計算
 */
function calculateSeverityStats(findings: EnhancedFinding[]) {
  const stats = { high: 0, medium: 0, low: 0 };
  findings.forEach(finding => {
    stats[finding.severity]++;
  });
  return stats;
}

/**
 * リスクスコアを計算（0-100）
 */
function calculateRiskScore(findings: EnhancedFinding[]): number {
  if (findings.length === 0) return 0;

  const weights = { high: 3, medium: 2, low: 1 };
  const totalWeight = findings.reduce((sum, finding) => sum + weights[finding.severity], 0);
  const maxPossibleWeight = findings.length * weights.high;

  return Math.round((totalWeight / maxPossibleWeight) * 100);
}

/**
 * 推奨アクションを生成
 */
function generateRecommendations(
  findings: EnhancedFinding[],
  categoryStats: ReturnType<typeof calculateCategoryStats>
): string[] {
  const recommendations: string[] = [];

  // 高リスク項目がある場合
  const highRiskCount = findings.filter(f => f.severity === 'high').length;
  if (highRiskCount > 0) {
    recommendations.push(`${highRiskCount}件の高リスク項目について、面接で詳細な確認を行ってください。`);
  }

  // カテゴリ別の推奨事項
  Object.entries(categoryStats).forEach(([category, stats]) => {
    if (stats.count > 2) {
      const config = CATEGORY_CONFIG[category as FindingCategory];
      recommendations.push(`${config.label}に関する懸念が${stats.count}件検出されました。この分野を重点的に確認することをお勧めします。`);
    }
  });

  // 全体的な推奨事項
  if (findings.length > 5) {
    recommendations.push('多数の懸念事項が検出されました。企業研究を十分に行い、面接で積極的に質問することをお勧めします。');
  }

  if (recommendations.length === 0) {
    recommendations.push('検出された懸念事項は比較的少ないですが、面接では具体的な例を聞いて詳細を確認しましょう。');
  }

  return recommendations;
}

/**
 * サマリーダッシュボードコンポーネント
 */
export function InsightsSummary({
  analysisResult,
  findings,
  className = ''
}: InsightsSummaryProps) {
  const categoryStats = calculateCategoryStats(findings);
  const severityStats = calculateSeverityStats(findings);
  const riskScore = calculateRiskScore(findings);
  const recommendations = generateRecommendations(findings, categoryStats);

  // 最も懸念の多いカテゴリを特定
  const topConcernCategory = Object.entries(categoryStats)
    .filter(([_, stats]) => stats.count > 0)
    .sort(([_, a], [__, b]) => b.count - a.count)[0];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 全体的なリスクレベル */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            総合リスク評価
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* リスクスコア */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{riskScore}</span>
                </div>
                <Progress value={riskScore} className="w-full h-2" />
              </div>
              <div className="text-sm text-muted-foreground">リスクスコア</div>
              <div className="text-xs text-muted-foreground mt-1">
                {riskScore < 30 ? '低リスク' : riskScore < 70 ? '中リスク' : '高リスク'}
              </div>
            </div>

            {/* 全体的なリスクレベル */}
            <div className="text-center">
              <div className="mb-4">
                <SeverityBadge severity={analysisResult.summary.risk_level} size="lg" />
              </div>
              <div className="text-sm text-muted-foreground">全体評価</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analysisResult.summary.total_findings}件の懸念事項
              </div>
            </div>

            {/* 検出カテゴリ数 */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {analysisResult.summary.categories_detected.length}
              </div>
              <div className="text-sm text-muted-foreground">検出カテゴリ</div>
              <div className="text-xs text-muted-foreground mt-1">
                全5カテゴリ中
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            カテゴリ別分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryStats)
              .filter(([_, stats]) => stats.count > 0)
              .sort(([_, a], [__, b]) => b.count - a.count)
              .map(([category, stats]) => {
                const config = CATEGORY_CONFIG[category as FindingCategory];
                const Icon = config.icon;

                return (
                  <Card key={category} className="relative overflow-hidden">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.count}件の懸念
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {Object.entries(stats.severities)
                          .filter(([_, count]) => count > 0)
                          .map(([severity, count]) => {
                            const severityConfig = SEVERITY_CONFIG[severity as Severity];
                            return (
                              <div key={severity} className="flex items-center justify-between text-xs">
                                <span className={severityConfig.color}>
                                  {severityConfig.label}
                                </span>
                                <span>{count}件</span>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {topConcernCategory && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">最も注意が必要な分野</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>{CATEGORY_CONFIG[topConcernCategory[0] as FindingCategory].label}</strong>
                で{topConcernCategory[1].count}件の懸念が検出されました。
                {CATEGORY_CONFIG[topConcernCategory[0] as FindingCategory].description}について、
                面接で重点的に確認することをお勧めします。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 重要度別統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            重要度別統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(severityStats)
              .filter(([_, count]) => count > 0)
              .sort(([a], [b]) => getSeverityOrder(b as Severity) - getSeverityOrder(a as Severity))
              .map(([severity, count]) => {
                const config = SEVERITY_CONFIG[severity as Severity];
                const Icon = config.icon;
                const percentage = Math.round((count / findings.length) * 100);

                return (
                  <div key={severity} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {count}件 ({percentage}%)
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* 推奨アクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            推奨アクション
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-primary">{index + 1}</span>
                </div>
                <p className="text-sm leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>

          {/* 総合的な推奨事項 */}
          <div className="mt-6 p-4 border-l-4 border-primary bg-primary/5">
            <h4 className="font-medium text-sm mb-2">💡 総合的な推奨事項</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysisResult.summary.overall_recommendation}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
