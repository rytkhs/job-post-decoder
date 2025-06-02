/**
 * DecodingResultコンポーネント
 * 求人票解析の結果を表示するコンポーネント
 * ローディング状態、エラー状態、および解析結果の表示を管理する
 * 強化版：Zustandストア統合、重要度表示、フィードバック機能、進捗表示、アニメーション、フィルタリング、質問生成、サマリーダッシュボード、アクセシビリティ対応を統合
 */
'use client';

import React, { useEffect, useRef } from 'react';
import {
  AlertCircle, // エラーアイコン
  Loader2,      // ローディングアイコン
  TrendingUp,   // 統計アイコン
  MessageSquare, // 質問アイコン
  Settings,     // 設定アイコン
  BarChart3,    // ダッシュボードアイコン
  List,         // リストアイコン
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AnalysisProgress } from './analysis/AnalysisProgress';
import { CompactStepVisualizer } from './analysis/StepVisualizer';
import { SeverityBadge, getSeverityOrder } from './results/SeverityBadge';
import { AnimatedResultList } from './results/AnimatedResultCard';
import { CategoryFilter, useCategoryFilter } from './results/CategoryFilter';
import { QuestionGenerator } from './shared/QuestionGenerator';
import { InsightsSummary } from './results/InsightsSummary';
import { saveFeedbackToStorage, loadFeedbackFromStorage } from './shared/FeedbackButton';
import { useAppStore } from '../store/appStore';
import {
  EnhancedAPIResponse,
  LLMResponse,
  EnhancedFinding,
  Finding,
  AnalysisProgress as AnalysisProgressType,
  FeedbackType
} from '../types/api';

/**
 * DecodingResultコンポーネントのプロパティ
 * 後方互換性のため、既存のLLMResponseと新しいEnhancedAPIResponseの両方をサポート
 */
interface DecodingResultProps {
  result: LLMResponse | EnhancedAPIResponse | null;
  isLoading: boolean;
  error: string | null;
  /** 解析進捗情報（オプション） */
  analysisProgress?: AnalysisProgressType;
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
 * 基本的なFindingをEnhancedFindingに変換する関数
 */
function enhanceFinding(finding: EnhancedFinding | Finding): EnhancedFinding {
  // 既にEnhancedFindingの場合はそのまま返す
  if ('severity' in finding && 'category' in finding) {
    return finding as EnhancedFinding;
  }

  // 基本的なFindingの場合はデフォルト値で拡張
  return {
    ...finding,
    severity: 'medium' as const,
    category: 'other' as const,
    confidence: 0.7,
    related_keywords: [],
    suggested_questions: []
  };
}

/**
 * レスポンスがEnhancedAPIResponseかどうかを判定する関数
 */
function isEnhancedResponse(result: LLMResponse | EnhancedAPIResponse | null): result is EnhancedAPIResponse {
  return result !== null && 'summary' in result && 'metadata' in result;
}

/**
 * 求人票解析結果を表示するコンポーネント
 */
export function DecodingResult({ result, isLoading, error, analysisProgress }: DecodingResultProps) {
  // Zustandストアから状態とアクションを取得
  const {
    // UI状態
    activeTab,
    enableAnimations,
    showAdvancedProgress,

    // フィードバック状態
    feedbackHistory,

    // アクション
    setActiveTab,
    toggleAnimations,
    toggleAdvancedProgress,
    setFeedback
  } = useAppStore();

  // アクセシビリティ用のref
  const mainContentRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  // 解析結果の処理
  const enhancedFindings = result?.findings
    ? result.findings.map((finding) => enhanceFinding(finding))
    : [];

  // 重要度順でソート
  const sortedFindings = [...enhancedFindings].sort((a, b) =>
    getSeverityOrder(b.severity) - getSeverityOrder(a.severity)
  );

  // カテゴリフィルター機能（ローカル状態として保持）
  const {
    selectedCategories,
    setSelectedCategories,
    filteredFindings
  } = useCategoryFilter(sortedFindings);

  // コンポーネントマウント時にローカルストレージからフィードバックを読み込み
  useEffect(() => {
    if (result?.findings) {
      result.findings.forEach((_, index) => {
        const findingId = `finding-${index}`;
        const feedback = loadFeedbackFromStorage(findingId);
        if (feedback && !feedbackHistory[findingId]) {
          setFeedback(findingId, feedback);
        }
      });
    }
  }, [result, feedbackHistory, setFeedback]);

  // 結果が変更された時にメインコンテンツにフォーカスを移動
  useEffect(() => {
    if (result && !isLoading && !error && mainContentRef.current) {
      // スクリーンリーダーに結果が更新されたことを通知
      const announcement = `解析が完了しました。${result.findings.length}件の結果が見つかりました。`;
      const ariaLiveRegion = document.createElement('div');
      ariaLiveRegion.setAttribute('aria-live', 'polite');
      ariaLiveRegion.setAttribute('aria-atomic', 'true');
      ariaLiveRegion.className = 'sr-only';
      ariaLiveRegion.textContent = announcement;
      document.body.appendChild(ariaLiveRegion);

      setTimeout(() => {
        document.body.removeChild(ariaLiveRegion);
      }, 1000);
    }
  }, [result, isLoading, error]);

  /**
   * キーボードナビゲーション用のハンドラー
   */
  const handleTabKeyDown = (event: React.KeyboardEvent, tabName: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tabName as 'results' | 'questions' | 'insights');
    }
  };

  /**
   * フィードバック送信ハンドラー
   */
  const handleFeedback = (findingId: string, feedback: FeedbackType) => {
    setFeedback(findingId, feedback);
    saveFeedbackToStorage(findingId, feedback);
  };

  /**
   * ローディング状態の表示
   */
  if (isLoading) {
    // 解析進捗情報がある場合は詳細な進捗を表示
    if (analysisProgress) {
      return (
        <div className="w-full max-w-3xl mx-auto mt-8 space-y-4" role="status" aria-live="polite">
          {/* 進捗表示切り替えボタン */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAdvancedProgress}
              className="text-muted-foreground"
              aria-label={showAdvancedProgress ? 'シンプル表示に切り替え' : '詳細表示に切り替え'}
            >
              {showAdvancedProgress ? 'シンプル表示' : '詳細表示'}
            </Button>
          </div>

          {/* 進捗表示 */}
          {showAdvancedProgress ? (
            <AnalysisProgress progress={analysisProgress} />
          ) : (
            <Card className="w-full max-w-3xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" aria-hidden="true" />
                <p className="text-center text-muted-foreground mb-4" aria-live="polite">
                  {analysisProgress.message}
                </p>
                <CompactStepVisualizer currentStep={analysisProgress.currentStep} />
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // 従来のローディング表示
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8" role="status" aria-live="polite">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" aria-hidden="true" />
          <p className="text-center text-muted-foreground">求人票を解析しています...</p>
          <p className="text-center text-sm text-muted-foreground mt-2">しばらくお待ちください</p>
        </CardContent>
      </Card>
    );
  }

  /**
   * エラー状態の表示
   */
  if (error) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 border-red-200 bg-red-50 dark:bg-red-900/10" role="alert">
        <CardContent className="flex items-center pt-6">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" aria-hidden="true" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  /**
   * 結果がない場合（初期状態）
   */
  if (!result || !result.findings) {
    return null;
  }

  /**
   * 解析結果が空の場合
   */
  if (result.findings.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8" role="status">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">この求人票には特に注意すべき表現は見つかりませんでした。</p>
        </CardContent>
      </Card>
    );
  }

  const isEnhanced = isEnhancedResponse(result);

  /**
   * 解析結果の表示
   */
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6" ref={mainContentRef} role="main">
      {/* 表示設定とタブ */}
      <div className="flex items-center justify-between">
        {/* タブナビゲーション */}
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="解析結果の表示切り替え"
          ref={tabListRef}
        >
          <Button
            variant={activeTab === 'results' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('results')}
            onKeyDown={(e) => handleTabKeyDown(e, 'results')}
            className="flex items-center gap-2"
            role="tab"
            aria-selected={activeTab === 'results'}
            aria-controls="results-panel"
            id="results-tab"
          >
            <List className="h-4 w-4" aria-hidden="true" />
            解析結果
          </Button>
          {isEnhanced && result.interview_questions.length > 0 && (
            <Button
              variant={activeTab === 'questions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('questions')}
              onKeyDown={(e) => handleTabKeyDown(e, 'questions')}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === 'questions'}
              aria-controls="questions-panel"
              id="questions-tab"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              質問生成
            </Button>
          )}
          {isEnhanced && (
            <Button
              variant={activeTab === 'insights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('insights')}
              onKeyDown={(e) => handleTabKeyDown(e, 'insights')}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === 'insights'}
              aria-controls="insights-panel"
              id="insights-tab"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              インサイト
            </Button>
          )}
        </div>

        {/* 設定ボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAnimations}
          className="flex items-center gap-2 text-muted-foreground"
          aria-label={enableAnimations ? 'アニメーションを無効にする' : 'アニメーションを有効にする'}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          {enableAnimations ? 'アニメーション無効' : 'アニメーション有効'}
        </Button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'results' && (
        <div
          className="space-y-6"
          role="tabpanel"
          id="results-panel"
          aria-labelledby="results-tab"
          tabIndex={0}
        >
          {/* サマリー情報（強化版のみ） */}
          {isEnhanced && (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  解析サマリー
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" role="group" aria-label="解析統計">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary" aria-label={`${result.summary.total_findings}件の表現が検出されました`}>
                      {result.summary.total_findings}
                    </div>
                    <div className="text-sm text-muted-foreground">検出された表現</div>
                  </div>
                  <div className="text-center">
                    <SeverityBadge severity={result.summary.risk_level} size="md" />
                    <div className="text-sm text-muted-foreground mt-1">注意レベル</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium" aria-label={`${result.summary.categories_detected.length}個のカテゴリで検出`}>
                      {result.summary.categories_detected.length}カテゴリ
                    </div>
                    <div className="text-sm text-muted-foreground">検出範囲</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">💡 総合的な推奨事項</h4>
                  <p className="text-sm text-muted-foreground">{result.summary.overall_recommendation}</p>
                </div>

                {result.summary.categories_detected.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">🏷️ 検出されたカテゴリ</h4>
                    <div className="flex flex-wrap gap-2" role="list" aria-label="検出されたカテゴリ一覧">
                      {result.summary.categories_detected.map(category => (
                        <Badge key={category} variant="secondary" className="text-xs" role="listitem">
                          {CATEGORY_LABELS[category] || category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* カテゴリフィルター */}
          {sortedFindings.length > 1 && (
            <CategoryFilter
              findings={sortedFindings}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              compact={true}
            />
          )}

          {/* 解析結果一覧 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📋 詳細な解析結果</h2>
              <div className="text-sm text-muted-foreground" aria-live="polite">
                {filteredFindings.length}件表示中（全{sortedFindings.length}件）
              </div>
            </div>

            {filteredFindings.length === 0 ? (
              <Card role="status">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    選択されたカテゴリに該当する結果がありません。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatedResultList
                findings={filteredFindings}
                onFeedback={handleFeedback}
                feedbackState={feedbackHistory}
                animated={enableAnimations}
              />
            )}
          </div>
        </div>
      )}

      {/* 質問生成タブ */}
      {activeTab === 'questions' && isEnhanced && result.interview_questions.length > 0 && (
        <div
          role="tabpanel"
          id="questions-panel"
          aria-labelledby="questions-tab"
          tabIndex={0}
        >
          <QuestionGenerator
            interviewQuestions={result.interview_questions}
            findings={sortedFindings}
          />
        </div>
      )}

      {/* インサイトタブ */}
      {activeTab === 'insights' && isEnhanced && (
        <div
          role="tabpanel"
          id="insights-panel"
          aria-labelledby="insights-tab"
          tabIndex={0}
        >
          <InsightsSummary
            analysisResult={result}
            findings={sortedFindings}
          />
        </div>
      )}
    </div>
  );
}
