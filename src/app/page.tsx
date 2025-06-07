'use client';

/**
 * メインページコンポーネント
 * 求人票デコーダーアプリケーションのメインページを構成する
 * 改善されたユーザーフロー、ヒーローセクション、ナビゲーション機能を追加
 * シンプルなツールUIでフォーム入力、API通信、結果表示の流れを管理する
 * Zustand状態管理とモダンなUIデザインを採用
 */

import { JobPostingForm } from './components/JobPostingForm';
import { CriticalDecodingResult } from './components/CriticalDecodingResult';
import { Footer } from './components/Footer';
import { useAppStore } from './store/appStore';
import { APIErrorResponse } from './types/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { Button } from './components/ui/button';
import { useRef } from 'react';

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
    // analysisHistory, // 未使用なのでコメントアウト

    // アクション
    setAnalysisResult,
    setOriginalText,
    setLoading,
    setError,
    setAnalysisProgress
    // TODO: 履歴機能は後で対応
    // addToHistory
  } = useAppStore();

  // ローカルステート
  // const [showHistory, setShowHistory] = useState(false); // 未使用なのでコメントアウト
  const formRef = useRef<HTMLDivElement>(null);

  /**
   * 解析進捗をシミュレートする関数
   * 実際のAPI処理中に進捗を更新する
   */
  const simulateProgress = () => {
    const steps = [
      { step: 'input' as const, progress: 5, message: '求人票を精査しています...', estimatedTime: 15 },
      { step: 'analyzing' as const, progress: 15, message: '甘い言葉を特定中...', estimatedTime: 12 },
      { step: 'analyzing' as const, progress: 35, message: 'ブラック要素を分析中...', estimatedTime: 9 },
      { step: 'analyzing' as const, progress: 55, message: '企業の本音を推測中...', estimatedTime: 6 },
      { step: 'analyzing' as const, progress: 75, message: '危険度を判定中...', estimatedTime: 4 },
      { step: 'results' as const, progress: 90, message: '辛口診断を作成中...', estimatedTime: 2 },
      { step: 'insights' as const, progress: 100, message: '診断完了！', estimatedTime: 0 }
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

        // より長い待機時間（10-15秒の処理に対応）
        const delay = currentStepIndex === 1 ? 2000 :
                     currentStepIndex === 2 ? 2500 :
                     currentStepIndex === 3 ? 3000 :
                     currentStepIndex === 4 ? 5000 :
                     currentStepIndex === 5 ? 3000 :
                     currentStepIndex === 6 ? 1500 : 500;

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

      // 解析履歴に追加（求人票のタイトルを抽出して保存）
      // TODO: 辛口診断システム対応後に復活
      // const jobTitle = extractJobTitle(text);
      // addToHistory(data, text, jobTitle);

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
  // const extractJobTitle = (text: string): string => { // 未使用なのでコメントアウト
  //   const lines = text.split('\n').filter(line => line.trim());
  //   if (lines.length > 0) {
  //     const firstLine = lines[0].trim();
  //     if (firstLine.length <= 50) {
  //       return firstLine;
  //     }
  //     return firstLine.substring(0, 50) + '...';
  //   }
  //   return '無題の求人票';
  // };

  /**
   * フォームセクションまでスクロール
   */
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

      /**
   * 履歴項目をロード（一時的にコメントアウト）
   */
  // const loadHistoryItem = (item: {
  //   id: string;
  //   timestamp: string;
  //   result: CriticalAnalysisResponse;
  //   originalText: string;
  //   jobTitle?: string;
  // }) => {
  //   setAnalysisResult(item.result);
  //   setOriginalText(item.originalText);
  //   setShowHistory(false);

  //   // 結果表示までスクロール
  //   setTimeout(() => {
  //     const resultSection = document.querySelector('[data-testid="result-section"]');
  //     resultSection?.scrollIntoView({ behavior: 'smooth' });
  //   }, 100);
  // };

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
                <Shield className="h-8 w-8 text-red-500" />
                <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                  ブラック求人チェッカー
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Protect Yourself from Bad Jobs
                </p>
              </div>
            </motion.div>

            {/* <motion.div
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
            </motion.div> */}
          </div>
        </div>

        {/* 履歴パネル */}
        {/* <AnimatePresence>
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
                        onClick={() => {
                          // TODO: 履歴機能復活時に対応
                        }}
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
        </AnimatePresence> */}
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
                  甘い言葉
                </span>
                に<br/>
                騙されるな！
              </h2>

              <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed">
                「アットホームな職場」「やりがいのある仕事」など、<br className="hidden sm:block"/>
                企業の巧妙な表現の裏にある本音を辛口診断！<br className="hidden sm:block"/>
                転職失敗を防ぐ強い味方です。
              </p>

              {/* 特徴カード */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <Shield className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">🔴 辛口診断</h3>
                  <p className="text-sm text-muted-foreground">
                    企業の甘い言葉を見破り、隠された本音を暴露
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <Users className="h-8 w-8 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">🟡 面接戦略</h3>
                  <p className="text-sm text-muted-foreground">
                    やんわりと本音を聞き出す実用的なテクニック
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="p-6 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">🟢 事例分析</h3>
                  <p className="text-sm text-muted-foreground">
                    よくあるパターンに基づいた具体的なアドバイス
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="space-y-6"
              >
                <Button
                  onClick={scrollToForm}
                  size="lg"
                  className="text-lg px-8 py-6 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  辛口診断を受ける
                  <ChevronDown className="h-5 w-5 ml-2 animate-bounce" />
                </Button>

                {/* 無料提供告知 */}
                {/* <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 text-sm mb-2">
                    <span className="text-green-600 dark:text-green-400 font-semibold">🆓 現在無料でご利用いただけます</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 text-center">
                    求職者の安全な転職活動をサポートするため、基本機能は無料で提供中
                  </p>
                </div> */}
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

              <CriticalDecodingResult
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
