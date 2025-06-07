/**
 * InterleaveDisplayコンポーネント
 * 原文テキストとデコード結果のインターリーブ表示機能
 * 設計書VD-UI-001に基づく実装
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SeverityBadge } from './SeverityBadge';
import { FeedbackButton } from '../shared/FeedbackButton';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Tag,
  Info,
  X,
  Settings,
  Loader2
} from 'lucide-react';
import {
  EnhancedAPIResponse,
  LLMResponse,
  EnhancedFinding,
  Finding,
  FeedbackType
} from '../../types/api';
import { MatchingOptions, EnhancedPhraseMatch } from '../../types/matching';
import { findEnhancedPhraseMatches, getMatchStyle } from '../../utils/enhanced-phrase-matching';
import { CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

/**
 * フレーズマッチ情報（後方互換性のため維持）
 * 現在はEnhancedPhraseMatchを使用
 */
// interface PhraseMatch {
//   /** マッチした開始位置 */
//   startIndex: number;
//   /** マッチした終了位置 */
//   endIndex: number;
//   /** 対応するデコード結果 */
//   finding: EnhancedFinding | Finding;
//   /** マッチしたフレーズ */
//   phrase: string;
// }

/**
 * テキストセグメント
 */
interface TextSegment {
  /** セグメントのテキスト */
  text: string;
  /** 通常テキストかハイライト部分か */
  type: 'normal' | 'highlight';
  /** ハイライト部分の場合のマッチ情報 */
  match?: EnhancedPhraseMatch;
}

/**
 * InterleaveDisplayコンポーネントのプロパティ
 */
interface InterleaveDisplayProps {
  /** 原文テキスト */
  originalText: string;
  /** 解析結果 */
  analysisResult: EnhancedAPIResponse | LLMResponse;
  /** フィードバック送信ハンドラー */
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  /** フィードバック状態 */
  feedbackState: Record<string, FeedbackType>;
  /** アニメーション有効化 */
  animated?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * マッチング設定コンポーネント
 */
interface MatchingSettingsProps {
  options: MatchingOptions;
  onOptionsChange: (options: MatchingOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function MatchingSettings({ options, onOptionsChange, isOpen, onToggle }: MatchingSettingsProps) {
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2"
        aria-label="マッチング設定を開く"
      >
        <Settings className="h-4 w-4" />
        設定
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">🎯 マッチング精度設定</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label="設定パネルを閉じる"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 gap-3">
          {/* 完全一致設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">完全一致</Label>
              <p className="text-xs text-muted-foreground">
                元フレーズと完全に一致するテキストを検出
              </p>
            </div>
            <Switch
              checked={options.enableExactMatch ?? true}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, enableExactMatch: checked })
              }
            />
          </div>

          {/* 正規化マッチング設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">文字正規化マッチング</Label>
              <p className="text-xs text-muted-foreground">
                全角/半角、句読点の違いを無視してマッチング
              </p>
            </div>
            <Switch
              checked={options.enableNormalization ?? true}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, enableNormalization: checked })
              }
            />
          </div>

          {/* ファジーマッチング設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">ファジーマッチング</Label>
              <p className="text-xs text-muted-foreground">
                改行や句読点の違いも考慮した柔軟なマッチング
              </p>
            </div>
            <Switch
              checked={options.enableFuzzyMatching ?? false}
              onCheckedChange={(checked) =>
                onOptionsChange({
                  ...options,
                  enableFuzzyMatching: checked,
                  fuzzyThreshold: checked ? 0.7 : 0
                })
              }
            />
          </div>

          {/* 信頼度表示設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">信頼度表示</Label>
              <p className="text-xs text-muted-foreground">
                マッチの種類と信頼度を視覚的に表示
              </p>
            </div>
            <Switch
              checked={options.showConfidence ?? false}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, showConfidence: checked })
              }
            />
          </div>

          {/* デバッグ情報設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">デバッグ情報</Label>
              <p className="text-xs text-muted-foreground">
                開発者向け：マッチング詳細をコンソールに出力
              </p>
            </div>
            <Switch
              checked={options.debug ?? false}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, debug: checked })
              }
            />
          </div>
        </div>

        {/* 設定の説明 */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>ファジーマッチング</strong>により、&quot;スキルアップ後は、ディレクターや...&quot;と&quot;スキルアップ後は、ディレクターや（改行）独立・フリーランス...&quot;のような表記違いを同じフレーズとして認識できます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 非同期でフレーズマッチをテキストから検索する
 */
async function findPhraseMatches(
  originalText: string,
  findings: (EnhancedFinding | Finding)[],
  options: MatchingOptions = {}
): Promise<EnhancedPhraseMatch[]> {
  return await findEnhancedPhraseMatches(originalText, findings, options);
}

/**
 * テキストをセグメントに分割する
 */
function segmentText(originalText: string, matches: EnhancedPhraseMatch[]): TextSegment[] {
  if (matches.length === 0) {
    return [{ text: originalText, type: 'normal' }];
  }

  // マッチ位置でソート
  const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

  // マッチの妥当性を検証
  const validMatches = sortedMatches.filter(match => {
    // 位置が無効な場合はスキップ
    if (match.startIndex < 0 || match.endIndex > originalText.length || match.startIndex >= match.endIndex) {
      console.warn('無効なマッチ位置をスキップ:', match);
      return false;
    }

    // 実際のマッチテキストを取得
    const actualMatchedText = originalText.substring(match.startIndex, match.endIndex);
    const finding = match.finding;

    // マッチしたテキストがfindingのoriginal_phraseまたはrelated_keywordsに関連しているかチェック
    const mainPhrase = finding.original_phrase || '';
    const relatedPhrases = ('related_keywords' in finding && finding.related_keywords) ? finding.related_keywords : [];
    const allPhrases = [mainPhrase, ...relatedPhrases].filter(Boolean);

    // 正規化を考慮した一致チェック
    const actualNormalized = actualMatchedText.toLowerCase().trim();
    const isRelated = allPhrases.some(phrase => {
      const phraseNormalized = phrase.toLowerCase().trim();
      return actualNormalized.includes(phraseNormalized) || phraseNormalized.includes(actualNormalized);
    });

    if (!isRelated) {
      console.warn('マッチしたテキストがfindingと関連していません:', {
        マッチテキスト: actualMatchedText,
        想定フレーズ: allPhrases,
        finding: finding.potential_realities[0]?.substring(0, 30) + '...'
      });
      return false;
    }

    return true;
  });

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  validMatches.forEach((match) => {
    // マッチ前のテキスト
    if (currentIndex < match.startIndex) {
      const beforeText = originalText.substring(currentIndex, match.startIndex);
      if (beforeText) {
        segments.push({ text: beforeText, type: 'normal' });
      }
    }

    // 既に処理済みの範囲の場合はスキップ
    if (match.startIndex < currentIndex) {
      console.warn('重複したマッチ範囲をスキップ:', match);
      return;
    }

    // マッチしたテキスト（元のテキストから正確に取得）
    const actualMatchedText = originalText.substring(match.startIndex, match.endIndex);
    segments.push({
      text: actualMatchedText,
      type: 'highlight',
      match: {
        ...match,
        phrase: actualMatchedText // 実際のテキストで上書き
      }
    });

    currentIndex = Math.max(currentIndex, match.endIndex);
  });

  // 最後のテキスト
  if (currentIndex < originalText.length) {
    const afterText = originalText.substring(currentIndex);
    if (afterText) {
      segments.push({ text: afterText, type: 'normal' });
    }
  }

  return segments;
}

/**
 * アコーディオンコンテンツコンポーネント
 */
interface AccordionContentProps {
  finding: EnhancedFinding | Finding;
  findingId: string;
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  initialFeedback?: FeedbackType | null;
  isOpen: boolean;
}

function AccordionContent({
  finding,
  findingId,
  onFeedback,
  initialFeedback,
  isOpen
}: AccordionContentProps) {
  const isEnhanced = 'severity' in finding;

  if (!isOpen) return null;

  return (
    <Card className="mt-2 border-l-4 border-l-primary/50 bg-muted/30">
      <CardContent className="p-4 space-y-4">
        {/* 建前（原文フレーズの再掲） */}
        <div>
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            建前
          </h5>
          <p className="text-sm bg-background/50 p-2 rounded italic">
            &ldquo;{finding.original_phrase}&rdquo;
          </p>
        </div>

        {/* 本音/解説 */}
        <div>
          <h5 className="font-medium text-sm text-primary mb-2">
            🔍 本音/解説
          </h5>
          <ul className="list-disc pl-5 space-y-1">
            {finding.potential_realities.map((reality, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {reality}
              </li>
            ))}
          </ul>
        </div>

        {/* 確認すべきポイント */}
        <div>
          <h5 className="font-medium text-sm text-primary mb-2">
            ✅ 確認すべきポイント
          </h5>
          <ul className="list-disc pl-5 space-y-1">
            {finding.points_to_check.map((point, idx) => (
              <li key={idx} className="text-sm leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* 拡張情報（EnhancedFindingの場合のみ） */}
        {isEnhanced && (
          <>
            {/* 考えられるリスク */}
            {finding.suggested_questions.length > 0 && (
              <div>
                <h5 className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  面接で使える質問例
                </h5>
                <ul className="list-disc pl-5 space-y-1">
                  {finding.suggested_questions.map((question, idx) => (
                    <li key={idx} className="text-sm leading-relaxed text-blue-700 dark:text-blue-300">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* タグ・メタ情報 */}
            {finding.related_keywords.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  関連キーワード
                </h5>
                <div className="flex flex-wrap gap-1">
                  {finding.related_keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* フィードバック */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            この情報は役に立ちましたか？
          </span>
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
 * ハイライトされたフレーズコンポーネント
 */
interface HighlightedPhraseProps {
  segment: TextSegment;
  findingId: string;
  isOpen: boolean;
  onToggle: () => void;
  onFeedback: (findingId: string, feedback: FeedbackType) => void;
  initialFeedback?: FeedbackType | null;
  showConfidence?: boolean;
}

function HighlightedPhrase({
  segment,
  findingId,
  isOpen,
  onToggle,
  onFeedback,
  initialFeedback,
  showConfidence = false
}: HighlightedPhraseProps) {
  const { match } = segment;
  if (!match) return <span>{segment.text}</span>;

  const isEnhanced = 'severity' in match.finding;
  const matchStyle = getMatchStyle(match);

  return (
    <span className="relative">
      {/* ハイライトされたフレーズ */}
      <span
        className={`
          cursor-pointer inline-flex items-center gap-1 px-1 rounded
          transition-all duration-200 hover:shadow-sm
          ${isOpen
            ? 'bg-primary/20 text-primary-foreground font-medium'
            : matchStyle
          }
        `}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
        aria-label={`${match.phrase}の詳細を${isOpen ? '閉じる' : '開く'}`}
        title={showConfidence ? `信頼度: ${Math.round(match.confidence * 100)}%` : undefined}
      >
        {segment.text}

        {/* 信頼度バッジ */}
        {showConfidence && (
          <Badge
            variant={
              match.confidence >= 0.9
                ? "default"
                : match.confidence >= 0.8
                ? "secondary"
                : "outline"
            }
            className="ml-1 text-xs h-4 px-1"
          >
            {Math.round(match.confidence * 100)}%
          </Badge>
        )}

        {/* 重要度バッジ（拡張版のみ） */}
        {isEnhanced && (
          <SeverityBadge severity={(match.finding as EnhancedFinding).severity} size="sm" />
        )}

        {/* アコーディオントリガー */}
        <span className="ml-1 text-xs opacity-70">
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      </span>

      {/* アコーディオンコンテンツ */}
      {isOpen && (
        <div className="relative">
          <AccordionContent
            finding={match.finding}
            findingId={findingId}
            onFeedback={onFeedback}
            initialFeedback={initialFeedback}
            isOpen={isOpen}
          />
        </div>
      )}
    </span>
  );
}

/**
 * InterleaveDisplayメインコンポーネント
 */
export function InterleaveDisplay({
  originalText,
  analysisResult,
  onFeedback,
  feedbackState,
  className = ''
}: InterleaveDisplayProps) {
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [matchingOptions, setMatchingOptions] = useState<MatchingOptions>({
    enableExactMatch: true,
    enableNormalization: true,
    enableFuzzyMatching: false,
    fuzzyThreshold: 0,
    showConfidence: false,
    debug: true
  });

  // 非同期処理の状態管理
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<EnhancedPhraseMatch[]>([]);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    averageConfidence: 0
  });

  // フレーズマッチングとセグメント化（非同期）
  useEffect(() => {
    const performMatching = async () => {
      if (!originalText.trim()) {
        setMatches([]);
        setSegments([]);
        setStats({ total: 0, byType: {}, averageConfidence: 0 });
        return;
      }

      setIsLoading(true);
      try {
        const findings = analysisResult.findings || [];
        const foundMatches = await findPhraseMatches(originalText, findings, matchingOptions);
        const textSegments = segmentText(originalText, foundMatches);

        // 統計情報
        const byType = foundMatches.reduce((acc, match) => {
          acc[match.matchType] = (acc[match.matchType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const calculatedStats = {
          total: foundMatches.length,
          byType,
          averageConfidence: foundMatches.length > 0
            ? foundMatches.reduce((sum, match) => sum + match.confidence, 0) / foundMatches.length
            : 0
        };

        setMatches(foundMatches);
        setSegments(textSegments);
        setStats(calculatedStats);
      } catch (error) {
        console.error('フレーズマッチング処理でエラー:', error);
        setMatches([]);
        setSegments([{ text: originalText, type: 'normal' }]);
        setStats({ total: 0, byType: {}, averageConfidence: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    performMatching();
  }, [originalText, analysisResult.findings, matchingOptions]);

  /**
   * アコーディオンの開閉切り替え
   */
  const toggleAccordion = (matchIndex: number) => {
    const accordionId = `accordion-${matchIndex}`;
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accordionId)) {
        newSet.delete(accordionId);
      } else {
        newSet.add(accordionId);
      }
      return newSet;
    });
  };

  /**
   * 全アコーディオンを閉じる
   */
  const closeAllAccordions = () => {
    setOpenAccordions(new Set());
  };

  if (!originalText.trim()) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          原文テキストが見つかりません。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">📄 原文・デコード結果インターリーブ表示</h3>
        <div className="flex items-center gap-2">
          {/* デバッグボタン */}
          {matchingOptions.debug && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.clear();
                console.log('=== デバッグテスト開始 ===');
                console.log('原文テキスト:', originalText.substring(0, 200) + '...');
                console.log('Findings数:', analysisResult.findings?.length);
                console.log('設定:', matchingOptions);

                // 最初のfindingを詳しく調べる
                if (analysisResult.findings && analysisResult.findings.length > 0) {
                  const firstFinding = analysisResult.findings[0];
                  console.log('最初のFinding:', {
                    original_phrase: firstFinding.original_phrase,
                    potential_realities: firstFinding.potential_realities,
                    related_keywords: 'related_keywords' in firstFinding ? firstFinding.related_keywords : []
                  });

                  // original_phraseが原文に含まれているかチェック
                  const phrase = firstFinding.original_phrase;
                  const index = originalText.indexOf(phrase);
                  console.log(`フレーズ "${phrase}" の原文内検索結果:`, index);
                  if (index !== -1) {
                    console.log('前後のテキスト:', originalText.substring(Math.max(0, index - 20), index + phrase.length + 20));
                  }
                }
              }}
              className="text-xs bg-red-50 border-red-200 text-red-700"
            >
              🐛 デバッグ
            </Button>
          )}
          <MatchingSettings
            options={matchingOptions}
            onOptionsChange={setMatchingOptions}
            isOpen={showSettings}
            onToggle={() => setShowSettings(!showSettings)}
          />
          {openAccordions.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={closeAllAccordions}
              className="text-xs"
            >
              すべて閉じる
            </Button>
          )}
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <MatchingSettings
          options={matchingOptions}
          onOptionsChange={setMatchingOptions}
          isOpen={showSettings}
          onToggle={() => setShowSettings(!showSettings)}
        />
      )}

      {/* 統計情報 */}
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center gap-4 flex-wrap">
          <span>検出された表現: {stats.total}件</span>
          <span>原文文字数: {originalText.length}文字</span>
          {stats.total > 0 && (
            <span>平均信頼度: {Math.round(stats.averageConfidence * 100)}%</span>
          )}
          {isLoading && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              解析中...
            </span>
          )}
        </div>
        {Object.keys(stats.byType).length > 0 && (
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-xs">マッチタイプ:</span>
            {Object.entries(stats.byType).map(([type, count]) => (
              <Badge key={type} variant="outline" className="text-xs">
                {type === 'exact' ? '完全' : type === 'normalized' ? '正規化' : type}: {count}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* インターリーブ表示 */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">フレーズを解析中...</p>
            </div>
          ) : (
            <div className="space-y-2 leading-relaxed text-sm">
              {segments.map((segment, index) => {
                if (segment.type === 'normal') {
                  return (
                    <span key={index} className="whitespace-pre-wrap">
                      {segment.text}
                    </span>
                  );
                }

                // ハイライト部分
                const matchIndex = matches.findIndex(
                  m => m.startIndex === segment.match?.startIndex &&
                       m.endIndex === segment.match?.endIndex
                );
                const accordionId = `accordion-${matchIndex}`;
                const findingId = `finding-${matchIndex}`;
                const isOpen = openAccordions.has(accordionId);

                return (
                  <span key={index}>
                    <HighlightedPhrase
                      segment={segment}
                      findingId={findingId}
                      isOpen={isOpen}
                      onToggle={() => toggleAccordion(matchIndex)}
                      onFeedback={onFeedback}
                      initialFeedback={feedbackState[findingId]}
                      showConfidence={matchingOptions.showConfidence}
                    />
                  </span>
                );
              })}
            </div>
          )}

          {/* マッチがない場合のメッセージ */}
          {!isLoading && matches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">🔍 現在の設定では検出可能な表現が見つかりません</p>
              <p className="text-xs">
                「文字正規化マッチング」を有効にすると、より多くの表現を検出できる可能性があります。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
