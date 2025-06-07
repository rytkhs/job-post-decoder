/**
 * テキスト正規化機能のテスト
 * VD-UI-002: フレーズマッチング精度向上
 */

import {
  normalizeText,
  lightNormalizeText,
  isNormalizedMatch,
  findNormalizedMatches,
  getNormalizationStats
} from '../../src/app/utils/text-normalization';

describe('normalizeText', () => {
  describe('基本的な正規化', () => {
    test('全角数字を半角に変換', () => {
      expect(normalizeText('１２３')).toBe('123');
      expect(normalizeText('年俸５００万円')).toBe('年俸500万円');
    });

    test('全角英字を半角に変換', () => {
      expect(normalizeText('ＡＢＣ')).toBe('ABC');
      expect(normalizeText('ＩＴエンジニア')).toBe('ITエンジニア');
    });

    test('記号の統一', () => {
      expect(normalizeText('本当？')).toBe('本当?');
      expect(normalizeText('すごい！')).toBe('すごい!');
      expect(normalizeText('（東京）')).toBe('(東京)');
    });

    test('空白の統一', () => {
      expect(normalizeText('東京　大阪　福岡')).toBe('東京 大阪 福岡');
      expect(normalizeText('  複数  の  スペース  ')).toBe('複数 の スペース');
    });

    test('句読点の除去', () => {
      expect(normalizeText('こんにちは、世界。')).toBe('こんにちは世界');
      expect(normalizeText('給与、賞与について。')).toBe('給与賞与について');
    });
  });

  describe('複合的な正規化', () => {
    test('複数の変換を同時に適用', () => {
      const input = '年俸５００万円（税込み）、賞与あり。';
      const expected = '年俸500万円(税込み)賞与あり';
      expect(normalizeText(input)).toBe(expected);
    });

    test('求人票によくある表現', () => {
      expect(normalizeText('月給２５万円〜３０万円')).toBe('月給25万円〜30万円');
      expect(normalizeText('ＩＴ企業での開発業務')).toBe('IT企業での開発業務');
      expect(normalizeText('やりがい！成長できる環境！')).toBe('やりがい!成長できる環境!');
    });
  });

  describe('エッジケース', () => {
    test('空文字列の処理', () => {
      expect(normalizeText('')).toBe('');
    });

    test('nullやundefinedの処理', () => {
      expect(normalizeText(null as any)).toBe('');
      expect(normalizeText(undefined as any)).toBe('');
    });

    test('数値の処理', () => {
      expect(normalizeText(123 as any)).toBe('');
    });

    test('日本語のみの文字列', () => {
      expect(normalizeText('こんにちは')).toBe('こんにちは');
    });

    test('英語のみの文字列', () => {
      expect(normalizeText('Hello World')).toBe('Hello World');
    });
  });
});

describe('lightNormalizeText', () => {
  test('軽量正規化は基本的な変換のみ実行', () => {
    const input = '年俸５００万円（税込み）、賞与あり。';
    const result = lightNormalizeText(input);

    // 全角数字は半角に変換される
    expect(result).toContain('500');
    // しかし記号や句読点はそのまま
    expect(result).toContain('（');
    expect(result).toContain('。');
  });

  test('空白の正規化は実行される', () => {
    expect(lightNormalizeText('  複数  スペース  ')).toBe('複数 スペース');
  });
});

describe('isNormalizedMatch', () => {
  test('正規化後に一致する文字列を検出', () => {
    expect(isNormalizedMatch('年俸５００万円', '年俸500万円')).toBe(true);
    expect(isNormalizedMatch('ＩＴエンジニア', 'ITエンジニア')).toBe(true);
    expect(isNormalizedMatch('こんにちは、世界。', 'こんにちは世界')).toBe(true);
  });

  test('正規化後も一致しない文字列', () => {
    expect(isNormalizedMatch('年俸500万円', '月給300万円')).toBe(false);
    expect(isNormalizedMatch('東京', '大阪')).toBe(false);
  });

  test('軽量正規化オプション', () => {
    expect(isNormalizedMatch('年俸５００万円（税込）', '年俸500万円（税込）', true)).toBe(true);
    expect(isNormalizedMatch('年俸５００万円（税込）', '年俸500万円(税込)', true)).toBe(false);
  });
});

describe('findNormalizedMatches', () => {
  const sampleText = '当社では年俸５００万円からスタート！ＩＴエンジニア募集中。経験者優遇、未経験者も歓迎します。';

  test('正規化マッチで複数の一致を検出', () => {
    const matches = findNormalizedMatches(sampleText, '500万円');
    expect(matches).toHaveLength(1);
    expect(matches[0].startIndex).toBeGreaterThan(0);
    expect(matches[0].endIndex).toBeGreaterThan(matches[0].startIndex);
    expect(matches[0].matchedText).toBe('５００万円');
  });

  test('正規化マッチで英字の変換を検出', () => {
    const matches = findNormalizedMatches(sampleText, 'ITエンジニア');
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedText).toBe('ＩＴエンジニア');
  });

  test('マッチしない場合は空配列を返す', () => {
    const matches = findNormalizedMatches(sampleText, '存在しないフレーズ');
    expect(matches).toHaveLength(0);
  });

  test('同じフレーズが複数回出現する場合', () => {
    const text = '年俸５００万円の求人と、年俸500万円の求人があります。';
    const matches = findNormalizedMatches(text, '年俸500万円');
    expect(matches).toHaveLength(2);
  });

  describe('エッジケース', () => {
    test('空文字列での検索', () => {
      expect(findNormalizedMatches('', 'test')).toHaveLength(0);
      expect(findNormalizedMatches('test', '')).toHaveLength(0);
    });

    test('完全に一致するテキスト', () => {
      const matches = findNormalizedMatches('年俸５００万円', '年俸500万円');
      expect(matches).toHaveLength(1);
      expect(matches[0].startIndex).toBe(0);
      expect(matches[0].endIndex).toBe(7);
    });
  });
});

describe('getNormalizationStats', () => {
  test('正規化統計情報の取得', () => {
    const stats = getNormalizationStats('年俸５００万円（税込み）、賞与あり。');

    expect(stats.originalLength).toBeGreaterThan(0);
    expect(stats.normalizedLength).toBeGreaterThan(0);
    expect(stats.normalizedLength).toBeLessThan(stats.originalLength);
    expect(stats.reductionRatio).toBeGreaterThan(0);
    expect(stats.reductionRatio).toBeLessThan(1);
    expect(stats.changedCharacters).toBeGreaterThan(0);
  });

  test('変更がない場合の統計', () => {
    const stats = getNormalizationStats('hello world');

    expect(stats.originalLength).toBe(stats.normalizedLength);
    expect(stats.reductionRatio).toBe(1);
    expect(stats.changedCharacters).toBe(0);
  });
});

describe('実際の求人票での動作確認', () => {
  const jobPostingSample = `
【募集要項】
■職種：ＩＴエンジニア
■給与：年俸５００万円〜８００万円（経験により決定）
■勤務地：東京都渋谷区（本社）
■待遇：各種社会保険完備、賞与年２回
■応募資格：大学卒業以上、ＩＴ経験３年以上優遇
※やる気のある方、大歓迎！
  `.trim();

  test('実際の求人票からの正規化マッチング', () => {
    // ITエンジニアの検出
    const itMatches = findNormalizedMatches(jobPostingSample, 'ITエンジニア');
    expect(itMatches.length).toBeGreaterThan(0);

    // 年俸の金額検出
    const salaryMatches = findNormalizedMatches(jobPostingSample, '500万円');
    expect(salaryMatches.length).toBeGreaterThan(0);

    // 経験年数の検出
    const experienceMatches = findNormalizedMatches(jobPostingSample, 'IT経験3年以上');
    expect(experienceMatches.length).toBeGreaterThan(0);
  });

  test('感嘆符を含む表現の正規化', () => {
    const matches = findNormalizedMatches(jobPostingSample, 'やる気のある方、大歓迎!');
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('パフォーマンステスト', () => {
  test('大きなテキストでの処理時間', () => {
    const largeText = '年俸５００万円のＩＴエンジニア求人。'.repeat(100);

    const startTime = performance.now();
    const matches = findNormalizedMatches(largeText, 'ITエンジニア');
    const endTime = performance.now();

    expect(matches.length).toBe(100);
    expect(endTime - startTime).toBeLessThan(500);
  });

  test('多数のフレーズでの処理', () => {
    const text = '年俸５００万円のＩＴエンジニア求人です。経験者優遇！';
    const phrases = ['ITエンジニア', '500万円', '経験者優遇!', '未経験者歓迎'];

    const startTime = performance.now();
    phrases.forEach(phrase => {
      findNormalizedMatches(text, phrase);
    });
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  });
});
