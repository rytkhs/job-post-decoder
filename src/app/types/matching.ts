/**
 * フレーズマッチング精度向上のための型定義
 * VD-UI-002: フレーズマッチング精度向上
 */

import { EnhancedFinding, Finding } from './api';

/**
 * マッチングの種類
 */
export type MatchType = 'exact' | 'normalized' | 'partial' | 'fuzzy';

/**
 * 基本的なフレーズマッチ情報
 */
export interface PhraseMatch {
  /** マッチした開始位置 */
  startIndex: number;
  /** マッチした終了位置 */
  endIndex: number;
  /** 対応するデコード結果 */
  finding: EnhancedFinding | Finding;
  /** マッチしたフレーズ */
  phrase: string;
}

/**
 * 拡張されたフレーズマッチ情報
 */
export interface EnhancedPhraseMatch {
  /** マッチした開始位置 */
  startIndex: number;
  /** マッチした終了位置 */
  endIndex: number;
  /** 対応するデコード結果 */
  finding: EnhancedFinding | Finding;
  /** マッチしたフレーズ */
  phrase: string;
  /** 元のフレーズ（finding内） */
  originalPhrase: string;
  /** マッチの種類 */
  matchType: MatchType;
  /** マッチの信頼度 (0-1) */
  confidence: number;
  /** マッチ位置の一意識別子 */
  id: string;
}

/**
 * マッチングオプション
 */
export interface MatchingOptions {
  /** 完全一致を有効にする */
  enableExactMatch?: boolean;
  /** 正規化マッチングを有効にする */
  enableNormalization?: boolean;
  /** 部分一致を有効にする */
  enablePartialMatch?: boolean;
  /** ファジーマッチングを有効にする */
  enableFuzzyMatching?: boolean;
  /** ファジーマッチングしきい値 (0-1) */
  fuzzyThreshold?: number;
  /** 信頼度表示を有効にする */
  showConfidence?: boolean;
  /** デバッグ情報を出力する */
  debug?: boolean;
  /** エラーログの詳細レベル */
  errorLogLevel?: 'minimal' | 'detailed';
  /** 精密ファジーマッチングを有効にする */
  enablePreciseFuzzy?: boolean;
  /** 動的検索ウィンドウサイズ調整を有効にする */
  enableDynamicWindow?: boolean;
  /** 類似度計算キャッシュを有効にする */
  enableSimilarityCache?: boolean;
  /** 最大検索範囲（文字数） */
  maxSearchRange?: number;
  /** 処理タイムアウト（ミリ秒） */
  processingTimeout?: number;
}

/**
 * マッチング結果の統計情報
 */
export interface MatchingStats {
  /** 総マッチ数 */
  totalMatches: number;
  /** マッチタイプ別の統計 */
  byType: Record<MatchType, number>;
  /** 平均信頼度 */
  averageConfidence: number;
  /** 処理時間（ミリ秒） */
  processingTime: number;
}

/**
 * キャッシュ統計情報
 */
export interface CacheStats {
  /** マッチキャッシュの現在サイズ */
  matchCacheSize: number;
  /** 類似度キャッシュの現在サイズ */
  similarityCacheSize: number;
  /** マッチキャッシュの最大サイズ */
  matchCacheMaxSize: number;
  /** 類似度キャッシュの最大サイズ */
  similarityCacheMaxSize: number;
}

/**
 * 視覚的なマッチ表示用の情報
 */
export interface MatchIndicator {
  /** 信頼度 */
  confidence: number;
  /** マッチの種類 */
  matchType: MatchType;
  /** 視覚的スタイル */
  visualStyle: {
    backgroundColor: string;
    borderStyle: string;
    opacity: number;
    className: string;
  };
}
