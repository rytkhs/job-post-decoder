'use client';

/**
 * メインページコンポーネント
 * 求人票デコーダーアプリケーションのメインページを構成する
 * フォーム入力、API通信、結果表示の流れを管理する
 */

import { useState } from 'react';
import { JobPostingForm } from './components/JobPostingForm';
import { DecodingResult } from './components/DecodingResult';

/**
 * 解析結果の個々の発見事項を表すインターフェース
 * @interface Finding
 * @property {string} original_phrase - 求人票から抽出された原文
 * @property {string[]} potential_realities - 原文の背後にある可能性のある本音のリスト
 * @property {string[]} points_to_check - 面接時などに確認すべきポイントのリスト
 */
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

/**
 * LLMからのレスポンス全体を表すインターフェース
 * @interface LLMResponse
 * @property {Finding[]} findings - 発見事項の配列
 */
interface LLMResponse {
  findings: Finding[];
}

/**
 * メインページコンポーネント
 * @returns {JSX.Element} - メインページのUI要素
 */
export default function Home() {
  /**
   * アプリケーションの状態管理
   * ローディング状態、エラー、解析結果を管理する
   */
  // APIリクエスト中のローディング状態を管理
  const [isLoading, setIsLoading] = useState(false);
  // エラーメッセージを管理
  const [error, setError] = useState<string | null>(null);
  // APIからの解析結果を管理
  const [decodingResult, setDecodingResult] = useState<LLMResponse | null>(null);

  /**
   * フォーム送信時の処理ハンドラー
   * 入力された求人票テキストをAPIに送信し、結果を取得する
   * @param {string} text - 入力された求人票テキスト
   */
  const handleSubmit = async (text: string) => {
    // 状態を初期化
    setIsLoading(true); // ローディング状態を開始
    setError(null); // 前回のエラーをクリア
    setDecodingResult(null); // 前回の結果をクリア
    
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
        throw new Error(data.error || 'デコードに失敗しました。');
      }
      
      // 成功時は結果を状態に設定
      setDecodingResult(data);
    } catch (err) {
      // エラー発生時の処理
      console.error('Error decoding job posting:', err);
      // エラーメッセージを状態に設定
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました。');
    } finally {
      // 処理完了時は必ずローディング状態を終了
      setIsLoading(false);
    }
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
        result={decodingResult} 
        isLoading={isLoading} 
        error={error} 
      />
    </div>
  );
}
