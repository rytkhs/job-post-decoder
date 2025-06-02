'use client';

/**
 * メインページコンポーネント
 * 求人票デコーダーアプリケーションのメインページを構成する
 * フォーム入力、API通信、結果表示の流れを管理する
 * 強化版：Zustand状態管理に移行
 */

import { JobPostingForm } from './components/JobPostingForm';
import { DecodingResult } from './components/DecodingResult';
import { useAppStore } from './store/appStore';
import {
  APIErrorResponse
} from './types/api';

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

    // アクション
    setAnalysisResult,
    setLoading,
    setError,
    setAnalysisProgress,
    addToHistory
  } = useAppStore();

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
    setLoading(true); // ローディング状態を開始
    setError(null); // 前回のエラーをクリア
    setAnalysisResult(null); // 前回の結果をクリア
    setAnalysisProgress(null); // 進捗をリセット

    // 進捗シミュレーションを開始
    simulateProgress();

    try {
      // APIリクエストを送信
      const response = await fetch('/api/decode-job-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }), // 求人票テキストをJSON形式で送信
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
      const jobTitle = extractJobTitle(text);
      addToHistory(data, jobTitle);

    } catch (err) {
      // エラー発生時の処理
      console.error('Error decoding job posting:', err);
      // エラーメッセージを状態に設定
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
    // 簡単なタイトル抽出ロジック
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      // 最初の行が短い場合はタイトルとして使用
      if (firstLine.length <= 50) {
        return firstLine;
      }
      // 長い場合は最初の50文字を使用
      return firstLine.substring(0, 50) + '...';
    }
    return '無題の求人票';
  };

  /**
   * メインページのUIをレンダリング
   */
  return (
    <div className="flex flex-col gap-8">
      {/* 入力フォームセクション */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-center">求人票のテキストを入力</h2>
        {/* 求人票入力フォームコンポーネント */}
        <JobPostingForm onSubmit={handleSubmit} isLoading={isLoading} />
      </section>

      {/* 解析結果表示セクション */}
      <DecodingResult
        result={currentResult}
        isLoading={isLoading}
        error={error}
        analysisProgress={analysisProgress ?? undefined}
      />
    </div>
  );
}
