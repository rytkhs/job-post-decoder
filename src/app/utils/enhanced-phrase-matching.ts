/**
 * 拡張フレーズマッチング機能
 * より柔軟なテキストマッチングを提供
 */

import { EnhancedFinding, Finding } from '../types/api';
import { MatchingOptions, EnhancedPhraseMatch, MatchType, CacheStats } from '../types/matching';

// 後方互換性のためのPhraseMatch型
interface LegacyPhraseMatch {
  startIndex: number;
  endIndex: number;
  finding: EnhancedFinding | Finding;
  phrase: string;
}

// 統計情報の型
interface MatchStats {
  totalMatches: number;
  byType: Record<MatchType, number>;
  averageConfidence: number;
  processingTime: number;
}

// エラーハンドリング強化：エラー詳細情報の型
interface MatchingError {
  type: 'phrase_processing' | 'position_calculation' | 'fuzzy_matching' | 'general';
  message: string;
  phrase?: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}

/**
 * LRUキャッシュ実装
 * メモリリークを防ぐためのサイズ制限付きキャッシュ
 */
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 最近使用したアイテムを最後に移動
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // 既存キーの場合は削除してから追加（順序更新）
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // サイズ上限に達した場合、最も古いアイテムを削除
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache for performance optimization with LRU
const matchCache = new LRUCache<string, EnhancedPhraseMatch[]>(500);
const similarityCache = new LRUCache<string, number>(2000);

// パフォーマンス制限（ファジーマッチング効率化）
const MAX_FUZZY_ITERATIONS = 200; // 増加：より多くの候補を検討
const MIN_PHRASE_LENGTH = 2; // 短縮：より短いフレーズも対象に
const MAX_SEARCH_WINDOW = 50; // 拡大：より広い範囲を検索

/**
 * エラーハンドリング強化：エラーロガー
 */
function logMatchingError(error: MatchingError, options: MatchingOptions = {}): void {
  const errorLevel = options?.errorLogLevel || 'minimal';

  if (options && (options.debug || errorLevel === 'detailed')) {
    console.group('🚨 フレーズマッチングエラー');
    console.error('エラータイプ:', error.type);
    console.error('メッセージ:', error.message);
    if (error.phrase) console.error('対象フレーズ:', error.phrase);
    if (error.context) console.error('コンテキスト:', error.context);
    if (error.originalError) console.error('元エラー:', error.originalError);
    console.groupEnd();
  } else {
    console.warn(`フレーズマッチングエラー [${error.type}]: ${error.message}`);
  }
}

/**
 * エラーハンドリング強化：安全な実行ラッパー
 */
async function safeExecute<T>(
  operation: () => Promise<T> | T,
  errorType: MatchingError['type'],
  context: { phrase?: string; [key: string]: unknown } = {},
  options: MatchingOptions = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const matchingError: MatchingError = {
      type: errorType,
      message: error instanceof Error ? error.message : String(error),
      phrase: context.phrase,
      originalError: error instanceof Error ? error : undefined,
      context
    };

    logMatchingError(matchingError, options);
    return null;
  }
}

/**
 * キャッシュをクリアする
 */
export function clearMatchCache() {
  matchCache.clear();
  similarityCache.clear();
}

/**
 * キャッシュ統計情報を取得
 */
export function getCacheStats(): CacheStats {
  return {
    matchCacheSize: matchCache.size(),
    similarityCacheSize: similarityCache.size(),
    matchCacheMaxSize: 500,
    similarityCacheMaxSize: 2000
  };
}

/**
 * テキストを正規化する
 * 改行、スペース、句読点、文字種の違いを統一
 */
export function normalizeText(text: string): string {
  return text
    // 改行を空白に変換
    .replace(/\r\n|\r|\n/g, ' ')
    // 連続する空白を単一の空白に
    .replace(/\s+/g, ' ')
    // 全角英数字を半角に
    .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // 全角記号を半角に（一部）
    .replace(/！/g, '!')
    .replace(/？/g, '?')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/／/g, '/')
    .replace(/￥/g, '\\')
    // 括弧類を統一
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}')
    // 句読点を統一
    .replace(/、/g, ',')
    .replace(/。/g, '.')
    // 前後の空白を除去
    .trim();
}

/**
 * 改行や区切り文字の違いを考慮したテキスト正規化
 * より柔軟なマッチング用
 */
export function flexibleNormalizeText(text: string): string {
  return text
    // 改行、スラッシュ、句読点を統一
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\/／]/g, ' ')
    .replace(/[、,]/g, ' ')
    .replace(/[。.]/g, ' ')
    // 連続する空白を単一に
    .replace(/\s+/g, ' ')
    // 全角半角統一
    .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
    // 記号統一
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[：:]/g, ':')
    .replace(/[！!]/g, '!')
    .replace(/[？?]/g, '?')
    // 前後の空白を除去
    .trim()
    // 大文字小文字統一
    .toLowerCase();
}

/**
 * 文字列の類似度を計算（最適化されたLevenshtein距離ベース）
 * メモリ効率化とパフォーマンス最適化を実装
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // 完全一致の早期チェック
  if (str1 === str2) return 1.0;

  // 長すぎる文字列は処理を制限
  const maxLength = 100;
  const s1 = str1.length > maxLength ? str1.substring(0, maxLength) : str1;
  const s2 = str2.length > maxLength ? str2.substring(0, maxLength) : str2;

  const len1 = s1.length;
  const len2 = s2.length;

  // 空文字列の早期チェック
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // 長さ差が大きすぎる場合は早期リターン
  const lengthDiff = Math.abs(len1 - len2);
  const maxLen = Math.max(len1, len2);
  if (lengthDiff > maxLen * 0.5) return 0;

  // キャッシュキーを生成（短い文字列のみキャッシュ）
  let cacheKey = '';
  if (len1 + len2 < 50) {
    cacheKey = `${len1}:${len2}:${s1}:${s2}`;
    const cached = similarityCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  // メモリ効率化：2行のみ使用する最適化されたDP
  const result = calculateOptimizedLevenshtein(s1, s2);

  // 短い文字列のみキャッシュ
  if (cacheKey && len1 + len2 < 50) {
    similarityCache.set(cacheKey, result);
  }

  return result;
}

/**
 * 最適化されたLevenshtein距離計算
 * メモリ使用量をO(min(m,n))に削減
 */
function calculateOptimizedLevenshtein(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  // 短い方を横軸にしてメモリ効率化
  const [shorter, longer] = len1 <= len2 ? [s1, s2] : [s2, s1];
  const shortLen = shorter.length;
  const longLen = longer.length;

  // 2行のみ使用
  let prevRow = new Array(shortLen + 1);
  let currRow = new Array(shortLen + 1);

  // 初期化
  for (let j = 0; j <= shortLen; j++) {
    prevRow[j] = j;
  }

  // 距離計算
  for (let i = 1; i <= longLen; i++) {
    currRow[0] = i;

    for (let j = 1; j <= shortLen; j++) {
      const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,      // 削除
        currRow[j - 1] + 1,  // 挿入
        prevRow[j - 1] + cost // 置換
      );
    }

    // 行を交換
    [prevRow, currRow] = [currRow, prevRow];
  }

  const distance = prevRow[shortLen];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
}

/**
 * 効率化された重複除去アルゴリズム O(n log n)
 * ソート＋線形スキャンによる最適化
 */
function deduplicateMatches(
  matches: EnhancedPhraseMatch[],
  originalText: string,
  options: MatchingOptions = {}
): EnhancedPhraseMatch[] {
  if (matches.length <= 1) return matches;

  // 1. 位置でソート（開始位置 → 終了位置 → 信頼度降順）
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    if (a.endIndex !== b.endIndex) {
      return a.endIndex - b.endIndex;
    }
    return b.confidence - a.confidence; // 信頼度高い順
  });

  // 2. 線形スキャンで重複除去
  const result: EnhancedPhraseMatch[] = [];
  let lastKept: EnhancedPhraseMatch | null = null;

  for (const current of sortedMatches) {
    let shouldKeep = true;

    if (lastKept) {
      // 完全重複チェック
      if (lastKept.startIndex === current.startIndex && lastKept.endIndex === current.endIndex) {
        shouldKeep = false;
        if (options.debug) {
          const matchedText = originalText.substring(current.startIndex, current.endIndex);
          console.log(`完全重複除去: "${matchedText}" (信頼度: ${current.confidence})`);
        }
      }
      // オーバーラップチェック
      else if (lastKept.endIndex > current.startIndex) {
        const currentLength = current.endIndex - current.startIndex;
        const lastLength = lastKept.endIndex - lastKept.startIndex;

        // より長い方、または同じ長さなら信頼度の高い方を優先
        if (currentLength > lastLength ||
           (currentLength === lastLength && current.confidence > lastKept.confidence)) {
          // 前のマッチを削除して現在のマッチを採用
          result.pop();
          lastKept = null;
        } else {
          shouldKeep = false;
          if (options.debug) {
            const matchedText = originalText.substring(current.startIndex, current.endIndex);
            console.log(`オーバーラップ除去: "${matchedText}"`);
          }
        }
      }
    }

    if (shouldKeep) {
      result.push(current);
      lastKept = current;
    }
  }

  return result;
}

/**
 * 非同期でフレーズの包含関係をチェック
 * 重い処理を分割してUIのブロックを防ぐ
 * エラーハンドリング強化済み
 */
export async function checkContainment(text: string, phrase: string, options: MatchingOptions = {}): Promise<EnhancedPhraseMatch[]> {
  return await safeExecute(async () => {
    const matches: EnhancedPhraseMatch[] = [];

    // フレーズが短すぎる場合はスキップ
    if (phrase.trim().length < MIN_PHRASE_LENGTH) {
      return matches;
    }

    // 完全一致チェック
    if (options.enableExactMatch !== false) {
      let searchStart = 0;
      while (searchStart < text.length) {
        const exactIndex = text.indexOf(phrase, searchStart);
        if (exactIndex === -1) break;

        matches.push({
          startIndex: exactIndex,
          endIndex: exactIndex + phrase.length,
          phrase: phrase,
          originalPhrase: phrase,
          matchType: 'exact',
          confidence: 1.0,
          finding: {} as EnhancedFinding | Finding,
          id: `exact-${exactIndex}`
        });

        searchStart = exactIndex + 1;
      }

      if (matches.length > 0) {
        return matches;
      }
    }

    // 正規化マッチングチェック
    if (options.enableNormalization !== false) {
      const normalizedText = normalizeText(text);
      const normalizedPhrase = normalizeText(phrase);

  let searchStart = 0;
      while (searchStart < normalizedText.length) {
        const normalizedIndex = normalizedText.indexOf(normalizedPhrase, searchStart);
        if (normalizedIndex === -1) break;

        // findOriginalPosition関数の修正版を使用
        const originalPosition = await safeExecute(
          () => findOriginalPositionImproved(text, normalizedText, normalizedIndex, normalizedPhrase.length),
          'position_calculation',
          { phrase, normalizedIndex, normalizedLength: normalizedPhrase.length },
          options
        );

        if (originalPosition) {
          const actualText = text.substring(originalPosition.start, originalPosition.end);
          matches.push({
            startIndex: originalPosition.start,
            endIndex: originalPosition.end,
            phrase: actualText,
            originalPhrase: phrase,
            matchType: 'normalized',
            confidence: 0.9,
            finding: {} as EnhancedFinding | Finding,
            id: `normalized-${originalPosition.start}`
          });
        }

        searchStart = normalizedIndex + 1;
      }

      if (matches.length > 0) {
        return matches;
      }
    }

    // ファジーマッチング（効率化済み）
    if (options.enableFuzzyMatching !== false && phrase.length >= MIN_PHRASE_LENGTH) {
      const fuzzyResult = await safeExecute(
        () => performOptimizedFuzzyMatching(text, phrase, options),
        'fuzzy_matching',
        { phrase },
        options
      );

      if (fuzzyResult) {
        matches.push(...fuzzyResult);
      }
    }

    return matches;
  }, 'phrase_processing', { phrase }, options) || [];
}

/**
 * 単一文字の正規化を行う
 * 文字単位の変換に特化した関数
 */
function normalizeChar(char: string): string {
  if (!char) return '';

  // 全角英数字を半角に
  if (/[０-９]/.test(char)) {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  }
  if (/[Ａ-Ｚａ-ｚ]/.test(char)) {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  }

  // 全角記号を半角に（一部）
  switch (char) {
    case '！': return '!';
    case '？': return '?';
    case '：': return ':';
    case '；': return ';';
    case '／': return '/';
    case '￥': return '\\';
    case '（': return '(';
    case '）': return ')';
    case '［': return '[';
    case '］': return ']';
    case '｛': return '{';
    case '｝': return '}';
    case '、': return ',';
    case '。': return '.';
    // 空白文字は保持
    case ' ':
    case '　':
      return ' ';
    default: return char;
  }
}

/**
 * findOriginalPosition関数の修正版
 * より正確な位置逆算を実現
 */
function findOriginalPositionImproved(
  originalText: string,
  normalizedText: string,
  normalizedIndex: number,
  normalizedLength: number
): { start: number; end: number } | null {
  // 正規化マッピングテーブルを事前構築
  const mappingTable: { original: number; normalized: number }[] = [];
  let normalizedPos = 0;

  for (let i = 0; i < originalText.length; i++) {
    mappingTable.push({ original: i, normalized: normalizedPos });

    const char = originalText[i];
    // 文字単位の正規化に適した関数を使用
    const normalizedChar = normalizeChar(char);

    // 正規化後の文字が空白でない場合のみカウント
    if (normalizedChar) {
      // 連続する空白を単一の空白に正規化する処理を模倣
      if (!(normalizedChar === ' ' && normalizedPos > 0 &&
            mappingTable[mappingTable.length - 2]?.normalized === normalizedPos - 1 &&
            normalizeChar(originalText[i - 1]) === ' ')) {
        normalizedPos++;
      }
    }
  }

  // 最後の位置も追加
  mappingTable.push({ original: originalText.length, normalized: normalizedPos });

  // バイナリサーチで開始位置を見つける
  const startIndex = findPositionByBinarySearch(mappingTable, normalizedIndex);
  const endIndex = findPositionByBinarySearch(mappingTable, normalizedIndex + normalizedLength);

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  return {
    start: Math.max(0, startIndex),
    end: Math.min(originalText.length, endIndex)
  };
}

/**
 * バイナリサーチによる位置検索（findOriginalPosition改善の補助関数）
 */
function findPositionByBinarySearch(
  mappingTable: { original: number; normalized: number }[],
  targetNormalizedPos: number
): number {
  let left = 0;
  let right = mappingTable.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const currentNormalizedPos = mappingTable[mid].normalized;

    if (currentNormalizedPos === targetNormalizedPos) {
      return mappingTable[mid].original;
    } else if (currentNormalizedPos < targetNormalizedPos) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // 完全一致しない場合は最も近い位置を返す
  return right >= 0 ? mappingTable[right].original : 0;
}

/**
 * ファジーマッチング効率化：最適化されたファジーマッチング実行
 */
async function performOptimizedFuzzyMatching(
  text: string,
  phrase: string,
  options: MatchingOptions = {}
): Promise<EnhancedPhraseMatch[]> {
  const matches: EnhancedPhraseMatch[] = [];
  const flexibleText = flexibleNormalizeText(text);
  const flexiblePhrase = flexibleNormalizeText(phrase);

  if (!flexibleText.includes(flexiblePhrase)) {
    return matches;
  }

  const flexibleIndex = flexibleText.indexOf(flexiblePhrase);
  const estimatedStart = Math.floor((flexibleIndex / flexibleText.length) * text.length);

  // 動的検索ウィンドウサイズ（オプション制御対応）
  let dynamicWindow = MAX_SEARCH_WINDOW;
  if (options?.enableDynamicWindow !== false) {
    dynamicWindow = Math.max(
      options?.maxSearchRange || MAX_SEARCH_WINDOW,
      phrase.length * 2
    );
  }

  const searchStart = Math.max(0, estimatedStart - dynamicWindow);
  const searchEnd = Math.min(text.length, estimatedStart + dynamicWindow);

  let bestMatch: { start: number; end: number; similarity: number } | null = null;
  let iterations = 0;
  const maxIterations = Math.min(MAX_FUZZY_ITERATIONS, searchEnd - searchStart);

  // スライディングウィンドウ方式で効率化
  const stepSize = Math.max(1, Math.floor((searchEnd - searchStart) / maxIterations));

  for (let start = searchStart; start <= searchEnd - phrase.length && iterations < maxIterations; start += stepSize) {
    const candidate = text.substring(start, start + phrase.length);

    // 類似度計算（キャッシュ制御対応）
    let similarity: number;
    if (options?.enableSimilarityCache !== false) {
      similarity = calculateSimilarity(flexibleNormalizeText(candidate), flexiblePhrase);
    } else {
      // キャッシュを使わない直接計算
      similarity = calculateSimilarityDirect(flexibleNormalizeText(candidate), flexiblePhrase);
    }

    if (similarity > (options?.fuzzyThreshold || 0.7)) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { start, end: start + phrase.length, similarity };
      }
    }

    iterations++;

    // 定期的にイベントループに制御を戻す（頻度を調整）
    if (iterations % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // より精密な検索（オプション制御対応）
  if (bestMatch && bestMatch.similarity < 0.95 && options?.enablePreciseFuzzy !== false) {
    const preciseMatch = await performPreciseFuzzySearch(
      text, phrase, bestMatch.start, options
    );
    if (preciseMatch && preciseMatch.similarity > bestMatch.similarity) {
      bestMatch = preciseMatch;
    }
  }

  if (bestMatch) {
    matches.push({
      startIndex: bestMatch.start,
      endIndex: bestMatch.end,
      phrase: text.substring(bestMatch.start, bestMatch.end),
      originalPhrase: phrase,
      matchType: 'fuzzy',
      confidence: bestMatch.similarity,
      finding: {} as EnhancedFinding | Finding,
      id: `fuzzy-${bestMatch.start}`
    });
  }

  return matches;
}

/**
 * 類似度計算（キャッシュなし版）
 * キャッシュを使いたくない場合の直接計算
 */
function calculateSimilarityDirect(str1: string, str2: string): number {
  // 長すぎる文字列は処理を制限
  const maxLength = 100;
  const s1 = str1.length > maxLength ? str1.substring(0, maxLength) : str1;
  const s2 = str2.length > maxLength ? str2.substring(0, maxLength) : str2;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // 差が大きすぎる場合は早期リターン
  if (Math.abs(len1 - len2) > Math.max(len1, len2) * 0.5) {
    return 0;
  }

  const matrix: number[][] = [];

  // 初期化
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 距離計算
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // 削除
        matrix[i][j - 1] + 1,     // 挿入
        matrix[i - 1][j - 1] + cost // 置換
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
}

/**
 * ファジーマッチング効率化：精密検索（補助関数）
 */
async function performPreciseFuzzySearch(
  text: string,
  phrase: string,
  centerPos: number,
  options: MatchingOptions = {}
): Promise<{ start: number; end: number; similarity: number } | null> {
  const preciseWindow = Math.min(10, phrase.length);
  const searchStart = Math.max(0, centerPos - preciseWindow);
  const searchEnd = Math.min(text.length - phrase.length, centerPos + preciseWindow);

  let bestMatch: { start: number; end: number; similarity: number } | null = null;

  for (let start = searchStart; start <= searchEnd; start++) {
    const candidate = text.substring(start, start + phrase.length);
    const similarity = calculateSimilarity(flexibleNormalizeText(candidate), flexibleNormalizeText(phrase));

    if (similarity > (options?.fuzzyThreshold || 0.7)) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { start, end: start + phrase.length, similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * 拡張フレーズマッチング（非同期版）
 * エラーハンドリング強化済み
 */
export async function findEnhancedPhraseMatches(
  originalText: string,
  findings: (EnhancedFinding | Finding)[],
  options: MatchingOptions = {}
): Promise<EnhancedPhraseMatch[]> {
  return await safeExecute(async () => {
    const cacheKey = `${originalText.length}-${findings.length}-${JSON.stringify(options)}`;

    const cached = matchCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (options.debug) {
      console.log('=== フレーズマッチング開始 ===');
      console.log('元テキスト文字数:', originalText.length);
      console.log('findings数:', findings.length);
      findings.forEach((finding, idx) => {
        console.log(`Finding ${idx}:`, {
          original_phrase: finding.original_phrase,
          potential_realities: finding.potential_realities.slice(0, 1), // 最初の1つだけ表示
          related_keywords: ('related_keywords' in finding) ? finding.related_keywords : []
        });
      });
    }

  const allMatches: EnhancedPhraseMatch[] = [];

    for (let findingIndex = 0; findingIndex < findings.length; findingIndex++) {
      const finding = findings[findingIndex];

      // EnhancedFindingとFindingの両方に対応
      const mainPhrase = finding.original_phrase || '';
      const relatedPhrases = ('related_keywords' in finding && finding.related_keywords) ? finding.related_keywords : [];

      if (options.debug) {
        console.log(`\n--- Finding ${findingIndex} 処理中 ---`);
        console.log('メインフレーズ:', mainPhrase);
        console.log('関連フレーズ:', relatedPhrases);
        console.log('実際の説明:', finding.potential_realities.slice(0, 1));
      }

      // メインフレーズを優先的に処理（エラーハンドリング強化）
      if (mainPhrase && mainPhrase.trim().length >= MIN_PHRASE_LENGTH) {
        const matches = await safeExecute(
          () => checkContainment(originalText, mainPhrase.trim(), options),
          'phrase_processing',
          { phrase: mainPhrase.trim(), findingIndex },
          options
        );

        if (matches && matches.length > 0) {
          if (options.debug) {
            console.log(`メインフレーズ "${mainPhrase.trim()}" のマッチ結果:`, matches.length, '件');
          }

          matches.forEach(match => {
            match.finding = finding;
            match.id = `finding-${findingIndex}-main-${match.matchType}-${match.startIndex}`;

            if (options.debug) {
              const matchedText = originalText.substring(match.startIndex, match.endIndex);
              console.log(`✓ メインフレーズマッチ:`, {
                検索フレーズ: mainPhrase.trim(),
                マッチしたテキスト: matchedText,
                位置: `${match.startIndex}-${match.endIndex}`,
                マッチタイプ: match.matchType,
                信頼度: Math.round(match.confidence * 100) + '%',
                説明: finding.potential_realities[0]?.substring(0, 50) + '...',
                findingIndex: findingIndex
              });
            }
          });

          allMatches.push(...matches);
        }
      }

      // 関連フレーズの処理（メインフレーズでマッチしなかった場合のみ）
      const mainMatches = allMatches.filter(m => m.finding === finding);
      if (mainMatches.length === 0) {
        for (let phraseIndex = 0; phraseIndex < relatedPhrases.length; phraseIndex++) {
          const phrase = relatedPhrases[phraseIndex];
          if (!phrase || phrase.trim().length < MIN_PHRASE_LENGTH) continue;

          const matches = await safeExecute(
            () => checkContainment(originalText, phrase.trim(), options),
            'phrase_processing',
            { phrase: phrase.trim(), findingIndex, phraseIndex },
            options
          );

          if (matches && matches.length > 0) {
            if (options.debug) {
              console.log(`関連フレーズ "${phrase.trim()}" のマッチ結果:`, matches.length, '件');
            }

            matches.forEach(match => {
              match.finding = finding;
              match.id = `finding-${findingIndex}-related-${phraseIndex}-${match.matchType}-${match.startIndex}`;

              if (options.debug) {
                const matchedText = originalText.substring(match.startIndex, match.endIndex);
                console.log(`✓ 関連フレーズマッチ:`, {
                  検索フレーズ: phrase.trim(),
                  マッチしたテキスト: matchedText,
                  位置: `${match.startIndex}-${match.endIndex}`,
                  マッチタイプ: match.matchType,
                  信頼度: Math.round(match.confidence * 100) + '%',
                  説明: finding.potential_realities[0]?.substring(0, 50) + '...',
                  findingIndex: findingIndex,
                  phraseIndex: phraseIndex
                });
              }
            });

            allMatches.push(...matches);
          }

          // 定期的にイベントループに制御を戻す
          if (phraseIndex % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      } else if (options.debug) {
        console.log(`メインフレーズでマッチしたため、関連フレーズはスキップ: ${relatedPhrases.join(', ')}`);
      }

      // 各findingの処理後にも制御を戻す
      if (findingIndex % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (options.debug) {
      console.log('\n=== 重複除去前の全マッチ ===');
      allMatches.forEach((match, idx) => {
        const matchedText = originalText.substring(match.startIndex, match.endIndex);
        console.log(`${idx}: "${matchedText}" (${match.startIndex}-${match.endIndex}) [${match.matchType}] -> ${match.finding.potential_realities[0]?.substring(0, 30)}...`);
      });
    }

    // 効率化された重複除去アルゴリズム O(n log n)
    // 既にソート済みで返される
    const sortedMatches = deduplicateMatches(allMatches, originalText, options);

    if (options.debug) {
      console.log('\n=== 最終的なマッチ結果 ===');
      sortedMatches.forEach((match, idx) => {
        const matchedText = originalText.substring(match.startIndex, match.endIndex);
        console.log(`${idx}: "${matchedText}" (${match.startIndex}-${match.endIndex}) -> ${match.finding.potential_realities[0]?.substring(0, 50)}...`);
      });
      console.log('=== フレーズマッチング完了 ===\n');
    }

    matchCache.set(cacheKey, sortedMatches);
    return sortedMatches;
  }, 'general', { originalTextLength: originalText.length, findingsCount: findings.length }, options || {}) || [];
}

/**
 * マッチの種類に応じたスタイルを取得
 */
export function getMatchStyle(match: EnhancedPhraseMatch): string {
  const baseClasses = "relative cursor-pointer transition-all duration-200 hover:shadow-sm";

  switch (match.matchType) {
    case 'exact':
      return `${baseClasses} bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-400`;
    case 'normalized':
      return `${baseClasses} bg-blue-100 hover:bg-blue-200 border-b-2 border-blue-400`;
    case 'partial':
      return `${baseClasses} bg-green-100 hover:bg-green-200 border-b-2 border-green-400`;
    case 'fuzzy':
      return `${baseClasses} bg-purple-100 hover:bg-purple-200 border-b-2 border-purple-400`;
    default:
      return `${baseClasses} bg-gray-100 hover:bg-gray-200 border-b-2 border-gray-400`;
  }
}

/**
 * 既存のfindPhraseMatches関数の拡張版（非同期）
 * 後方互換性を保ちながら新機能を提供
 */
export async function findPhraseMatchesEnhanced(
  originalText: string,
  findings: (EnhancedFinding | Finding)[],
  options: MatchingOptions = {}
): Promise<LegacyPhraseMatch[]> {
  const enhancedMatches = await findEnhancedPhraseMatches(originalText, findings, options);

  // EnhancedPhraseMatchをPhraseMatchに変換（後方互換性）
  return enhancedMatches.map((match) => ({
    startIndex: match.startIndex,
    endIndex: match.endIndex,
    finding: match.finding,
    phrase: match.phrase
  }));
}

/**
 * マッチング統計情報を取得（非同期）
 */
export async function getMatchingStats(
  originalText: string,
  findings: (EnhancedFinding | Finding)[],
  options: MatchingOptions = {}
): Promise<MatchStats> {
  const startTime = performance.now();
  const matches = await findEnhancedPhraseMatches(originalText, findings, options);
  const endTime = performance.now();

  const byType: Record<MatchType, number> = {
    exact: 0,
    normalized: 0,
    partial: 0,
    fuzzy: 0
  };

  let totalConfidence = 0;

  matches.forEach((match) => {
    byType[match.matchType]++;
    totalConfidence += match.confidence;
  });

  return {
    totalMatches: matches.length,
    byType,
    averageConfidence: matches.length > 0 ? totalConfidence / matches.length : 0,
    processingTime: endTime - startTime
  };
}
