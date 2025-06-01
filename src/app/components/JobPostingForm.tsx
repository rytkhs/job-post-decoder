'use client';

/**
 * JobPostingFormコンポーネント
 * 求人票テキストを入力し、解析を開始するフォームコンポーネント
 * テキスト入力、例文挿入、クリア機能、および送信機能を提供する
 */

import React from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileText, Send } from 'lucide-react';

/**
 * JobPostingFormコンポーネントのプロパティ
 * @property {function} onSubmit - フォーム送信時に実行されるコールバック関数
 * @property {boolean} isLoading - ローディング状態を示すフラグ
 */
interface JobPostingFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

/**
 * 求人票フォームコンポーネント
 * @param {JobPostingFormProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} - レンダリングされるUI要素
 */
export function JobPostingForm({ onSubmit, isLoading }: JobPostingFormProps) {
  // テキスト入力の状態管理
  const [text, setText] = React.useState('');
  // テキストエリアへの参照（クリア機能後にフォーカスを設定するため）
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  /**
   * フォーム送信時のハンドラー
   * @param {React.FormEvent} e - フォームイベント
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトの送信動作を防止
    if (text.trim()) { // 空のテキストを送信しないようにチェック
      onSubmit(text);
    }
  };

  /**
   * テキストエリアをクリアするハンドラー
   * テキストを空にし、テキストエリアにフォーカスを設定する
   */
  const handleClearText = () => {
    setText(''); // テキストを空に設定
    if (textareaRef.current) {
      textareaRef.current.focus(); // クリア後にテキストエリアにフォーカス
    }
  };

  /**
   * 例文をテキストエリアに挿入するハンドラー
   * テスト用やデモ用のサンプル求人票テキストを提供する
   */
  const handlePasteExample = () => {
    // サンプル求人票テキスト
    const exampleText = `【募集職種】
営業職（未経験歓迎）

【給与】
月給22万円～（経験・能力を考慮）
※残業代別途支給

【勤務時間】
9:00～18:00（実働8時間）
※繁忙期は残業あり

【休日・休暇】
完全週休2日制（土日祭）
年間休日120日
有給休暇、慶弓休暇あり

【待遇・福利厚生】
各種社会保険完備
交通費支給（上限あり）
社員割引制度
資格取得支援
アットホームな職場環境

【求める人物像】
・チャレンジ精神のある方
・コミュニケーション能力の高い方
・成長意欲のある方

【会社概要】
設立：2005年
資本金：3,000万円
従業員数：50名（男性30名、女性20名）
事業内容：法人向けITソリューション提供`;
    setText(exampleText); // 例文をテキストエリアに設定
  };

  /**
   * コンポーネントのUIをレンダリング
   */
  return (
    <div className="w-full max-w-3xl mx-auto bg-card rounded-lg border p-6 shadow-sm">
      {/* 求人票入力フォーム */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          {/* ヘッダー部分：ラベルとボタングループ */}
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="job-posting-text" className="text-base font-medium">
              求人票のテキストを入力してください
            </label>
            {/* ボタングループ：例文挿入とクリア */}
            <div className="flex gap-2">
              {/* 例文挿入ボタン */}
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handlePasteExample}
                disabled={isLoading} // ローディング中は無効化
              >
                <FileText className="h-4 w-4 mr-1" />
                例文を挿入
              </Button>
              {/* クリアボタン - テキストが空またはローディング中は無効化 */}
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleClearText}
                disabled={isLoading || !text.trim()}
              >
                クリア
              </Button>
            </div>
          </div>
          {/* テキスト入力エリア */}
          <Textarea
            ref={textareaRef} // クリア機能後にフォーカスを設定するための参照
            id="job-posting-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ここに求人票のテキストを貼り付けてください（例：給与、勤務時間、待遇・福利厚生など）"
            className="min-h-[250px] resize-y text-base"
            disabled={isLoading} // ローディング中は無効化
          />
          {/* プライバシーに関する注意書き */}
          <p className="text-xs text-muted-foreground mt-1">※ 入力された情報は解析のみに使用され、保存されません</p>
        </div>
        {/* 送信ボタンセクション */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={isLoading || !text.trim()} // ローディング中または空のテキストの場合は無効化
            className="px-6 py-2 h-auto"
          >
            {/* ローディング状態に応じてボタンの表示を切り替え */}
            {isLoading ? (
              <>
                <span className="animate-pulse">デコード中...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                デコード開始
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
