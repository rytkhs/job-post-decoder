'use client';

/**
 * JobPostingFormコンポーネント
 * 求人票テキストを入力し、解析を開始するフォームコンポーネント
 * モダンなUI、アニメーション、アクセシビリティ機能を提供する
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileText, Send, Trash2, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * JobPostingFormコンポーネントのプロパティ
 */
interface JobPostingFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

/**
 * 文字数カウンターコンポーネント
 */
interface CharacterCounterProps {
  current: number;
  max: number;
}

function CharacterCounter({ current, max }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = percentage > 100;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1">
        {isOverLimit ? (
          <AlertCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
        ) : current > 0 ? (
          <CheckCircle2 className="h-3 w-3 text-success" aria-hidden="true" />
        ) : null}
        <span
          className={`font-mono transition-colors ${
            isOverLimit
              ? 'text-destructive font-semibold'
              : isNearLimit
              ? 'text-warning'
              : 'text-muted-foreground'
          }`}
        >
          {current.toLocaleString()}{max && `/${max.toLocaleString()}`}
        </span>
      </div>
      {max && (
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full transition-colors ${
              isOverLimit
                ? 'bg-destructive'
                : isNearLimit
                ? 'bg-warning'
                : 'bg-success'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 求人票フォームコンポーネント
 */
export function JobPostingForm({ onSubmit, isLoading }: JobPostingFormProps) {
  const [text, setText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showExampleAnimation, setShowExampleAnimation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARACTERS = 10000;
  const MIN_CHARACTERS = 50;

  /**
   * フォーム送信時のハンドラー
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (trimmedText && trimmedText.length >= MIN_CHARACTERS) {
      onSubmit(trimmedText);
    }
  }, [text, onSubmit]);

  /**
   * テキストエリアをクリアするハンドラー
   */
  const handleClearText = useCallback(() => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  /**
   * 例文をテキストエリアに挿入するハンドラー
   */
  const handlePasteExample = useCallback(() => {
    setShowExampleAnimation(true);

    const exampleText = `【募集職種】
営業職（未経験歓迎）

【給与】
月給22万円～（経験・能力を考慮）
※残業代別途支給

【勤務時間】
9:00～18:00（実働8時間）
※繁忙期は残業あり

【休日・休暇】
完全週休2日制（土日祝）
年間休日120日
有給休暇、慶弔休暇あり

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

    // アニメーション付きでテキストを設定
    setTimeout(() => {
      setText(exampleText);
      setShowExampleAnimation(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 300);
  }, []);

  /**
   * ファイルドロップハンドラー
   */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => file.type === 'text/plain');

    if (textFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText(content.slice(0, MAX_CHARACTERS));
        }
      };
      reader.readAsText(textFile);
    }
  }, []);

  /**
   * ファイル選択ハンドラー
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setText(content.slice(0, MAX_CHARACTERS));
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const canSubmit = text.trim().length >= MIN_CHARACTERS && text.length <= MAX_CHARACTERS && !isLoading;
  const isOverLimit = text.length > MAX_CHARACTERS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="card-enhanced glass-effect rounded-2xl p-6 sm:p-8 shadow-xl border border-border/50">
        {/* ヘッダーセクション */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-gradient">
              求人票を解析
            </h2>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </motion.div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            求人票のテキストを入力すると、AIが隠れた意味や注意点を解析します
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* ツールバー */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="job-posting-text" className="text-sm font-medium">
                  求人票テキスト
                </label>
                <span className="text-xs text-muted-foreground">
                  (最低{MIN_CHARACTERS}文字)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* ファイルアップロードボタン */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="hidden sm:flex"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  ファイル
                </Button>

                {/* 例文挿入ボタン */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePasteExample}
                  disabled={isLoading || showExampleAnimation}
                  className="transition-all duration-300 hover:scale-105"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {showExampleAnimation ? '挿入中...' : '例文挿入'}
                </Button>

                {/* クリアボタン */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearText}
                  disabled={isLoading || !text.trim()}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  クリア
                </Button>
              </div>
            </div>

            {/* テキスト入力エリア */}
            <div className="relative">
              <motion.div
                className={`relative rounded-lg border-2 transition-all duration-300 ${
                  isDragOver
                    ? 'border-primary border-dashed bg-primary/5'
                    : isOverLimit
                    ? 'border-destructive/50'
                    : 'border-input hover:border-primary/50 focus-within:border-primary'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <Textarea
                  ref={textareaRef}
                  id="job-posting-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="ここに求人票のテキストを貼り付けてください（例：給与、勤務時間、待遇・福利厚生など）"
                  className="min-h-[300px] resize-none border-0 bg-transparent text-base leading-relaxed focus:ring-0 placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                  maxLength={MAX_CHARACTERS}
                  aria-describedby="character-count privacy-notice"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--muted-foreground) transparent'
                  }}
                />

                {/* ドラッグオーバーレイ */}
                <AnimatePresence>
                  {isDragOver && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-2 border-2 border-dashed border-primary rounded-lg bg-primary/10 flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-primary">
                          テキストファイルをドロップ
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ファイル入力（非表示） */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="テキストファイルを選択"
              />
            </div>

            {/* 文字数カウンターとプライバシー情報 */}
            <div className="flex items-center justify-between text-xs">
              <div id="character-count">
                <CharacterCounter current={text.length} max={MAX_CHARACTERS} />
              </div>
              <p id="privacy-notice" className="text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  🔒 入力データは保存されません
                </span>
              </p>
            </div>

            {/* エラーメッセージ */}
            <AnimatePresence>
              {isOverLimit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>文字数制限を超えています。{MAX_CHARACTERS.toLocaleString()}文字以内で入力してください。</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 送信ボタンセクション */}
          <div className="flex justify-center pt-4">
            <motion.div whileHover={{ scale: canSubmit ? 1.05 : 1 }} whileTap={{ scale: canSubmit ? 0.95 : 1 }}>
              <Button
                type="submit"
                disabled={!canSubmit}
                className={`px-8 py-3 h-auto text-base font-semibold transition-all duration-300 ${
                  canSubmit
                    ? 'btn-primary bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>解析中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    <span>AI解析を開始</span>
                  </div>
                )}
              </Button>
            </motion.div>
          </div>

          {/* 補助情報 */}
          <div className="text-center space-y-2 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              💡 より詳細な解析のため、求人票の全文を貼り付けることをお勧めします
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>✨ AI解析</span>
              <span>🔍 隠れた意味を発見</span>
              <span>⚡ 瞬時に結果</span>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
