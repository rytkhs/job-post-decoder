'use client';

/**
 * メインページコンポーネント
 * 求人票デコーダーアプリケーションのメインページを構成する
 * 改善されたユーザーフロー、ヒーローセクション、ナビゲーション機能を追加
 * シンプルなツールUIでフォーム入力、API通信、結果表示の流れを管理する
 * Zustand状態管理とモダンなUIデザインを採用
 */

import { JobPostingForm } from './components/JobPostingForm';
import { DecodingResult } from './components/DecodingResult';
import { Footer } from './components/Footer';
import { useAppStore } from './store/appStore';
import { APIErrorResponse, EnhancedAPIResponse, LLMResponse } from './types/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Shield,
  Users,
  TrendingUp,
  History,
  ChevronDown,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from './components/ui/button';
import { useState, useRef } from 'react';

/**
 * メインページコンポーネント
 * @returns {JSX.Element} - メインページのUI要素
 */
export default function Home() {
  // Zustandストアから状態とアクションを取得
  const {
    // 状態
    currentResult,
    isLoading,
    error,
    analysisProgress,
    analysisHistory,

    // アクション
    setAnalysisResult,
    setOriginalText,
    setLoading,
    setError,
    setAnalysisProgress,
    addToHistory
  } = useAppStore();

  // ローカルステート
  const [showHistory, setShowHistory] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  /**
   * 解析進捗をシミュレートする関数
   * 実際のAPI処理中に進捗を更新する
   */
  const simulateProgress = () => {
    const steps = [
      { step: 'input' as const, progress: 10, message: '入力内容を確認しています...', estimatedTime: 8 },
      { step: 'analyzing' as const, progress: 30, message: 'AI解析を実行しています...', estimatedTime: 6 },
      { step: 'analyzing' as const, progress: 60, message: '詳細な分析を行っています...', estimatedTime: 4 },
      { step: 'results' as const, progress: 85, message: '結果を整理しています...', estimatedTime: 2 },
      { step: 'insights' as const, progress: 100, message: '解析が完了しました', estimatedTime: 0 }
    ];

    let currentStepIndex = 0;

    const updateProgress = () => {
      if (currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        setAnalysisProgress({
          currentStep: currentStep.step,
          progress: currentStep.progress,
          message: currentStep.message,
          estimatedTime: currentStep.estimatedTime
        });
        currentStepIndex++;

        // 次のステップまでの待機時間を設定
        const delay = currentStepIndex === 1 ? 1000 :
                     currentStepIndex === 2 ? 2000 :
                     currentStepIndex === 3 ? 3000 :
                     currentStepIndex === 4 ? 1500 : 500;

        setTimeout(updateProgress, delay);
      }
    };

    updateProgress();
  };

  /**
   * フォーム送信時の処理ハンドラー
   * 入力された求人票テキストをAPIに送信し、結果を取得する
   * @param {string} text - 入力された求人票テキスト
   */
  const handleSubmit = async (text: string) => {
    // 状態を初期化
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setAnalysisProgress(null);

    // 原文テキストをストアに保存
    setOriginalText(text);

    // 進捗シミュレーションを開始
    simulateProgress();

    try {
      // APIリクエストを送信
      const response = await fetch('/api/decode-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      // APIレスポンスをJSONとして解析
      const data = await response.json();

      // レスポンスが正常でない場合はエラーを投げる
      if (!response.ok) {
        const errorData = data as APIErrorResponse;
        throw new Error(errorData.error || 'デコードに失敗しました。');
      }

      // 成功時は結果を状態に設定
      setAnalysisResult(data);

      // インターリーブ表示をデフォルトに設定
      const { setActiveTab } = useAppStore.getState();
      setActiveTab('interleave');

      // 解析履歴に追加（求人票のタイトルを抽出して保存）
      const jobTitle = extractJobTitle(text);
      addToHistory(data, text, jobTitle);

    } catch (err) {
      // エラー発生時の処理
      console.error('Error decoding job posting:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
    } finally {
      // 処理完了時は必ずローディング状態を終了
      setLoading(false);
      setAnalysisProgress(null);
    }
  };

  /**
   * 求人票テキストからタイトルを抽出する関数
   * @param {string} text - 求人票テキスト
   * @returns {string} - 抽出されたタイトル
   */
  const extractJobTitle = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length <= 50) {
        return firstLine;
      }
      return firstLine.substring(0, 50) + '...';
    }
    return '無題の求人票';
  };

  /**
   * フォームセクションまでスクロール
   */
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

      /**
   * 履歴項目をロード
   */
  const loadHistoryItem = (item: {
    id: string;
    timestamp: string;
    result: EnhancedAPIResponse | LLMResponse;
    originalText: string;
    jobTitle?: string;
  }) => {
    setAnalysisResult(item.result);
    setOriginalText(item.originalText);
    setShowHistory(false);

    // インターリーブ表示をデフォルトに設定
    const { setActiveTab } = useAppStore.getState();
    setActiveTab('interleave');

    // 結果表示までスクロール
    setTimeout(() => {
      const resultSection = document.querySelector('[data-testid="result-section"]');
      resultSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー・ナビゲーション */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <Sparkles className="h-8 w-8 text-primary" />
                <Zap className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                  求人票デコーダー
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  AI-Powered Job Analysis
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center space-x-2"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center space-x-1"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">履歴</span>
                {analysisHistory.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-1">
                    {analysisHistory.length}
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
        </div>

        {/* 履歴パネル */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t bg-card/50 backdrop-blur-sm"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {analysisHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      まだ解析履歴がありません
                    </p>
                  ) : (
                    analysisHistory.map((item, index) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.jobTitle || extractJobTitle(item.originalText)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.timestamp).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ヒーローセクション */}
      {!currentResult && !isLoading && (
        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
                求人票の
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  隠された意味
                </span>
                を<br/>
                AIが解析します
              </h2>

              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                「アットホームな職場」「やる気のある方歓迎」など、<br className="hidden sm:block"/>
                求人票の曖昧な表現の裏にある本音を明らかにし、<br className="hidden sm:block"/>
                より良い転職活動をサポートします。
              </p>

              {/* 特徴カード */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">リスク分析</h3>
                  <p className="text-sm text-muted-foreground">
                    注意すべき表現を特定し、潜在的なリスクを評価
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <Users className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">質問提案</h3>
                  <p className="text-sm text-muted-foreground">
                    面接で確認すべき具体的な質問を自動生成
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">インサイト</h3>
                  <p className="text-sm text-muted-foreground">
                    業界知識に基づいた深い洞察を提供
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="text-lg px-8 py-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  無料で始める
                  <ChevronDown className="h-5 w-5 ml-2 animate-bounce" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* 入力フォーム - 結果表示時は隠す */}
        <AnimatePresence mode="wait">
          {!currentResult && !isLoading && (
            <motion.section
              ref={formRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <JobPostingForm onSubmit={handleSubmit} isLoading={isLoading} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* 解析結果表示 */}
        <AnimatePresence mode="wait">
          {(currentResult || isLoading || error) && (
            <motion.div
              data-testid="result-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* 新しい解析ボタン */}
              {currentResult && !isLoading && (
                <div className="flex justify-center mb-6">
                  <Button
                    onClick={() => {
                      setAnalysisResult(null);
                      setError(null);
                      setOriginalText(null);
                      scrollToForm();
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    新しい求人票を解析
                  </Button>
                </div>
              )}

              <DecodingResult
                result={currentResult}
                isLoading={isLoading}
                error={error}
                analysisProgress={analysisProgress ?? undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* フッター */}
      <Footer />
    </div>
  );
}
