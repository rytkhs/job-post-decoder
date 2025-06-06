/**
 * テキスト正規化ユーティリティ
 * VD-UI-002: フレーズマッチング精度向上
 *
 * 全角/半角、記号、空白の統一処理を行い、
 * より柔軟なフレーズマッチングを実現します。
 */

/**
 * テキスト正規化関数
 * 全角/半角、記号、空白の統一処理を行います
 *
 * @param text 正規化対象のテキスト
 * @returns 正規化されたテキスト
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return (
    text
      // 全角数字 → 半角変換
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      // 全角英字 → 半角変換
      .replace(/[Ａ-Ｚａ-ｚ]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      )
      // 記号の統一
      .replace(/[！？]/g, (s) => (s === "！" ? "!" : "?"))
      .replace(/[（）]/g, (s) => (s === "（" ? "(" : ")"))
      .replace(/[「」]/g, (s) => (s === "「" ? "「" : "」"))
      .replace(/[『』]/g, (s) => (s === "『" ? "『" : "』"))
      // 長音符の統一
      .replace(/[ー－―─]/g, "ー")
      // 空白の統一
      .replace(/[\u00A0\u2000-\u200B\u2028\u2029\u3000]/g, " ") // 各種空白文字を通常のスペースに
      .replace(/\s+/g, " ") // 連続する空白を1つに
      .trim()
      // 句読点の正規化（オプション：完全除去）
      .replace(/[。、]/g, "")
  );
}

/**
 * 軽量な正規化（空白と基本的な全角/半角のみ）
 * パフォーマンスが重要な場合に使用
 *
 * @param text 正規化対象のテキスト
 * @returns 軽量正規化されたテキスト
 */
export function lightNormalizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 2つのテキストが正規化後に一致するかチェック
 *
 * @param text1 比較対象テキスト1
 * @param text2 比較対象テキスト2
 * @param light 軽量正規化を使用するか（デフォルト: false）
 * @returns 正規化後に一致する場合true
 */
export function isNormalizedMatch(
  text1: string,
  text2: string,
  light: boolean = false
): boolean {
  const normalize = light ? lightNormalizeText : normalizeText;
  return normalize(text1) === normalize(text2);
}

/**
 * テキスト内で正規化されたフレーズを検索
 *
 * @param text 検索対象テキスト
 * @param phrase 検索フレーズ
 * @param light 軽量正規化を使用するか（デフォルト: false）
 * @returns 見つかった位置の配列
 */
export function findNormalizedMatches(
  text: string,
  phrase: string,
  light: boolean = false
): Array<{ startIndex: number; endIndex: number; matchedText: string }> {
  if (!text || !phrase) {
    return [];
  }

  const normalize = light ? lightNormalizeText : normalizeText;
  const normalizedText = normalize(text);
  const normalizedPhrase = normalize(phrase);

  const matches: Array<{ startIndex: number; endIndex: number; matchedText: string }> = [];
  let searchStart = 0;

  while (true) {
    const index = normalizedText.indexOf(normalizedPhrase, searchStart);
    if (index === -1) break;

    // 元のテキストでの対応する位置を見つける
    const originalMatch = findOriginalPosition(text, index, normalizedPhrase.length, normalize);
    if (originalMatch) {
      matches.push({
        startIndex: originalMatch.startIndex,
        endIndex: originalMatch.endIndex,
        matchedText: text.slice(originalMatch.startIndex, originalMatch.endIndex)
      });
    }

    searchStart = index + 1;
  }

  return matches;
}

/**
 * 正規化されたテキストの位置から元のテキストの位置を逆算
 * パフォーマンス最適化版
 */
function findOriginalPosition(
  originalText: string,
  normalizedIndex: number,
  normalizedLength: number,
  normalize: (text: string) => string
): { startIndex: number; endIndex: number } | null {
  let currentNormalizedPos = 0;
  let startIndex = -1;
  let endIndex = -1;
  const targetEndIndex = normalizedIndex + normalizedLength;

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];
    const normalizedChar = normalize(char);

    if (normalizedChar) {
      // 開始位置の検出
      if (startIndex === -1 && currentNormalizedPos >= normalizedIndex) {
        startIndex = i;
      }

      currentNormalizedPos += normalizedChar.length;

      // 終了位置の検出
      if (endIndex === -1 && currentNormalizedPos >= targetEndIndex) {
        endIndex = i + 1;
        break;
      }
    }
  }

  // 見つからなかった場合のフォールバック
  if (startIndex === -1) startIndex = 0;
  if (endIndex === -1) endIndex = originalText.length;

  return {
    startIndex: Math.max(0, startIndex),
    endIndex: Math.min(originalText.length, endIndex)
  };
}

/**
 * 正規化処理の統計情報を取得
 * デバッグやパフォーマンス分析に使用
 */
export function getNormalizationStats(
  originalText: string
): {
  originalLength: number;
  normalizedLength: number;
  reductionRatio: number;
  changedCharacters: number;
} {
  const normalized = normalizeText(originalText);
  const changedCharacters = originalText.length - normalized.length;

  return {
    originalLength: originalText.length,
    normalizedLength: normalized.length,
    reductionRatio: normalized.length / originalText.length,
    changedCharacters
  };
}

/**
 * デバッグ用：正規化の詳細情報を表示
 */
export function debugNormalization(text: string): void {
  console.group('🔍 Text Normalization Debug');
  console.log('Original:', text);
  console.log('Normalized:', normalizeText(text));
  console.log('Light Normalized:', lightNormalizeText(text));
  console.log('Stats:', getNormalizationStats(text));
  console.groupEnd();
}
