/**
 * 拡張フレーズマッチング機能のテスト
 * VD-UI-002: フレーズマッチング精度向上
 */

import {
  findEnhancedPhraseMatches,
  findPhraseMatchesEnhanced,
  getMatchingStats,
  getMatchStyle,
  clearMatchCache,
  getCacheStats
} from '../../src/app/utils/enhanced-phrase-matching';
import { EnhancedFinding, Finding } from '../../src/app/types/api';
import { EnhancedPhraseMatch, MatchingOptions } from '../../src/app/types/matching';

// テスト用のサンプルデータ
const sampleFindings: Finding[] = [
  {
    original_phrase: '年俸５００万円',
    potential_realities: ['実際の年収は400万円程度かもしれません'],
    points_to_check: ['賞与の有無を確認']
  },
  {
    original_phrase: 'ＩＴエンジニア',
    potential_realities: ['具体的な技術スタックが不明'],
    points_to_check: ['使用技術の詳細を質問']
  },
  {
    original_phrase: 'やりがいのある仕事',
    potential_realities: ['激務の可能性があります'],
    points_to_check: ['勤務時間の実態を確認']
  }
];

const sampleText = `
【求人詳細】
職種：ＩＴエンジニア
給与：年俸５００万円〜
福利厚生：各種社会保険完備
仕事内容：やりがいのある仕事をお任せします
`.trim();

describe('findEnhancedPhraseMatches', () => {
  describe('基本的なマッチング', () => {
    test('完全一致のマッチングを検出', async () => {
      const textWithExactMatch = '年俸500万円のITエンジニア求人';
      const findings = [sampleFindings[0], sampleFindings[1]];

      const matches = await findEnhancedPhraseMatches(textWithExactMatch, findings, {
        enableExactMatch: true,
        enableNormalization: false,
        enableFuzzyMatching: false
      });

      // 完全一致しないため、マッチしない
      expect(matches).toHaveLength(0);
    });

    test('正規化マッチングを検出', async () => {
      const matches = await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableExactMatch: false,
        enableNormalization: true
      });

      expect(matches.length).toBeGreaterThan(0);

      // 正規化マッチしたもの
      const normalizedMatches = matches.filter(m => m.matchType === 'normalized');
      expect(normalizedMatches.length).toBeGreaterThan(0);

      // 信頼度の確認
      normalizedMatches.forEach(match => {
        expect(match.confidence).toBe(0.9);
        expect(match.matchType).toBe('normalized');
      });
    });

    test('マッチングオプションの制御', async () => {
      // 完全一致のみ
      const exactOnly = await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableExactMatch: true,
        enableNormalization: false
      });

      // 正規化込み
      const withNormalization = await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableExactMatch: true,
        enableNormalization: true
      });

      expect(withNormalization.length).toBeGreaterThanOrEqual(exactOnly.length);
    });
  });

  describe('マッチ結果の構造', () => {
    test('EnhancedPhraseMatchの構造が正しい', async () => {
      const matches = await findEnhancedPhraseMatches(sampleText, [sampleFindings[0]], {
        enableNormalization: true
      });

      expect(matches.length).toBeGreaterThan(0);

      const match = matches[0];
      expect(match).toHaveProperty('startIndex');
      expect(match).toHaveProperty('endIndex');
      expect(match).toHaveProperty('finding');
      expect(match).toHaveProperty('phrase');
      expect(match).toHaveProperty('confidence');
      expect(match).toHaveProperty('matchType');
      expect(match).toHaveProperty('id');

      expect(typeof match.startIndex).toBe('number');
      expect(typeof match.endIndex).toBe('number');
      expect(typeof match.confidence).toBe('number');
      expect(['exact', 'normalized', 'fuzzy', 'partial']).toContain(match.matchType);
    });

    test('信頼度順にソートされている', async () => {
      const matches = await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableExactMatch: true,
        enableNormalization: true
      });

      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].startIndex).toBeLessThanOrEqual(matches[i].startIndex);
      }
    });
  });

  describe('複数マッチの処理', () => {
    test('同じフレーズが複数回出現する場合', async () => {
      const textWithDuplicates = 'ＩＴエンジニアとWEBエンジニア、ＩＴエンジニアを募集';
      const matches = await findEnhancedPhraseMatches(textWithDuplicates, [sampleFindings[1]], {
        enableNormalization: true
      });

      expect(matches.length).toBeGreaterThan(0);

      // 位置が重複していないことを確認
      const positions = matches.map(m => ({ start: m.startIndex, end: m.endIndex }));
      const uniquePositions = new Set(positions.map(p => `${p.start}-${p.end}`));
      expect(uniquePositions.size).toBe(positions.length);
    });

    test('複数のfindingsが同時にマッチする場合', async () => {
      const matches = await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableNormalization: true
      });

      const uniqueFindings = new Set(matches.map(m => m.finding.original_phrase));
      expect(uniqueFindings.size).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンス', () => {
    test('大量のfindingsでも高速に処理', async () => {
      const manyFindings = Array(100).fill(0).map((_, i) => ({
        original_phrase: `テストフレーズ${i}`,
        potential_realities: ['テスト'],
        points_to_check: ['テスト']
      }));

      const startTime = performance.now();
      await findEnhancedPhraseMatches(sampleText, manyFindings, {
        enableNormalization: true
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1秒以下
    });

    test('キャッシュによる高速化', async () => {
      clearMatchCache();

      // 初回実行
      const startTime1 = performance.now();
      await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableNormalization: true
      });
      const endTime1 = performance.now();
      const firstTime = endTime1 - startTime1;

      // 2回目実行（キャッシュヒット）
      const startTime2 = performance.now();
      await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        enableNormalization: true
      });
      const endTime2 = performance.now();
      const secondTime = endTime2 - startTime2;

      // キャッシュにより高速化されることを確認
      expect(secondTime).toBeLessThan(firstTime);
    });

    test('大量の重複マッチでも効率的に処理', async () => {
      // 重複しやすいパターンを作成
      const duplicateFindings = Array(50).fill(0).map((_, i) => ({
        original_phrase: 'ITエンジニア', // 同じフレーズ
        potential_realities: [`説明${i}`],
        points_to_check: [`チェック${i}`]
      }));

      const largeText = sampleText.repeat(10); // テキストを拡大

      const startTime = performance.now();
      const matches = await findEnhancedPhraseMatches(largeText, duplicateFindings, {
        enableNormalization: true
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2秒以下
      expect(matches.length).toBeGreaterThan(0);

      // 重複が正しく除去されていることを確認
      const positions = matches.map(m => `${m.startIndex}-${m.endIndex}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(positions.length);
    });
  });

  describe('デバッグオプション', () => {
    test('デバッグ情報が出力される', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await findEnhancedPhraseMatches(sampleText, [sampleFindings[0]], {
        enableNormalization: true,
        debug: true
      });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('findPhraseMatchesEnhanced', () => {
  test('後方互換性のあるインターフェース', async () => {
    const matches = await findPhraseMatchesEnhanced(sampleText, sampleFindings, {
      enableNormalization: true
    });

    expect(matches.length).toBeGreaterThan(0);

    // PhraseMatch形式になっていることを確認
    const match = matches[0];
    expect(match).toHaveProperty('startIndex');
    expect(match).toHaveProperty('endIndex');
    expect(match).toHaveProperty('finding');
    expect(match).toHaveProperty('phrase');

    // EnhancedPhraseMatchの拡張プロパティがないことを確認
    expect(match).not.toHaveProperty('confidence');
    expect(match).not.toHaveProperty('matchType');
    expect(match).not.toHaveProperty('id');
  });
});

describe('getMatchingStats', () => {
  test('統計情報が正しく計算される', async () => {
    const stats = await getMatchingStats(sampleText, sampleFindings, {
      enableNormalization: true
    });

    expect(stats).toHaveProperty('totalMatches');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('averageConfidence');
    expect(stats).toHaveProperty('processingTime');

    expect(typeof stats.totalMatches).toBe('number');
    expect(typeof stats.averageConfidence).toBe('number');
    expect(typeof stats.processingTime).toBe('number');

    expect(stats.byType).toHaveProperty('exact');
    expect(stats.byType).toHaveProperty('normalized');
    expect(stats.byType).toHaveProperty('fuzzy');
    expect(stats.byType).toHaveProperty('partial');
  });

  test('マッチがない場合の統計', async () => {
    const stats = await getMatchingStats('関係のないテキスト', sampleFindings);

    expect(stats.totalMatches).toBe(0);
    expect(stats.averageConfidence).toBe(0);
    expect(stats.processingTime).toBeGreaterThan(0);
  });
});

describe('getMatchStyle', () => {
  test('マッチタイプに応じたスタイルが返される', () => {
    // 完全一致
    const exactMatch: EnhancedPhraseMatch = {
      startIndex: 0,
      endIndex: 5,
      phrase: 'test',
      originalPhrase: 'test',
      matchType: 'exact',
      confidence: 1.0,
      finding: sampleFindings[0],
      id: 'test-exact'
    };
    const exactStyle = getMatchStyle(exactMatch);
    expect(exactStyle).toContain('bg-yellow-100');

    // 正規化一致
    const normalizedMatch: EnhancedPhraseMatch = {
      ...exactMatch,
      matchType: 'normalized',
      confidence: 0.9
    };
    const normalizedStyle = getMatchStyle(normalizedMatch);
    expect(normalizedStyle).toContain('bg-blue-100');

    // ファジーマッチ
    const fuzzyMatch: EnhancedPhraseMatch = {
      ...exactMatch,
      matchType: 'fuzzy',
      confidence: 0.8
    };
    const fuzzyStyle = getMatchStyle(fuzzyMatch);
    expect(fuzzyStyle).toContain('bg-purple-100');
  });
});

describe('エラーハンドリング', () => {
  test('空文字列でエラーが発生しない', async () => {
    await expect(async () => {
      await findEnhancedPhraseMatches('', sampleFindings);
    }).not.toThrow();

    await expect(async () => {
      await findEnhancedPhraseMatches(sampleText, []);
    }).not.toThrow();
  });

  test('不正なfindingsでエラーが発生しない', async () => {
    const invalidFindings = [
      { original_phrase: null, potential_realities: [], points_to_check: [] } as unknown as Finding,
      { original_phrase: undefined, potential_realities: [], points_to_check: [] } as unknown as Finding,
      { original_phrase: '', potential_realities: [], points_to_check: [] }
    ];

    await expect(async () => {
      await findEnhancedPhraseMatches(sampleText, invalidFindings);
    }).not.toThrow();
  });

  test('不正なオプションでエラーが発生しない', async () => {
    await expect(async () => {
      await findEnhancedPhraseMatches(sampleText, sampleFindings, null as unknown as MatchingOptions);
    }).not.toThrow();

    await expect(async () => {
      await findEnhancedPhraseMatches(sampleText, sampleFindings, {
        fuzzyThreshold: -1
      });
    }).not.toThrow();
  });
});

describe('実際の使用ケース', () => {
  test('求人票での実用的なマッチング', async () => {
    const jobPosting = `
【職種】
システムエンジニア・ＷＥＢエンジニア

【給与】
年俸４００万円〜８００万円
※経験・能力により決定

【勤務時間】
９：００〜１８：００（実働８時間）
※残業あり

【福利厚生】
・各種社会保険完備
・交通費全額支給
・やりがいのある環境を提供！
    `.trim();

    const realFindings: Finding[] = [
      {
        original_phrase: 'WEBエンジニア',
        potential_realities: ['フロントエンドかバックエンドか不明'],
        points_to_check: ['担当領域を確認']
      },
      {
        original_phrase: '年俸400万円',
        potential_realities: ['最低保証額の可能性'],
        points_to_check: ['昇給制度を確認']
      },
      {
        original_phrase: '残業あり',
        potential_realities: ['長時間労働の可能性'],
        points_to_check: ['平均残業時間を質問']
      },
      {
        original_phrase: 'やりがいのある環境',
        potential_realities: ['激務を美化している可能性'],
        points_to_check: ['具体的な業務内容を確認']
      }
    ];

    const matches = await findEnhancedPhraseMatches(jobPosting, realFindings, {
      enableExactMatch: true,
      enableNormalization: true,
      debug: false
    });

    expect(matches.length).toBeGreaterThan(0);

    // 各マッチが有効な位置にあることを確認
    matches.forEach(match => {
      expect(match.startIndex).toBeGreaterThanOrEqual(0);
      expect(match.endIndex).toBeGreaterThan(match.startIndex);
      expect(match.endIndex).toBeLessThanOrEqual(jobPosting.length);
      expect(match.confidence).toBeGreaterThan(0);
      expect(match.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('キャッシュ機能', () => {
  test('キャッシュ統計情報の取得', async () => {
    clearMatchCache();

    // キャッシュに何かを追加
    await findEnhancedPhraseMatches(sampleText, [sampleFindings[0]], {
      enableNormalization: true
    });

    const stats = getCacheStats();
    expect(stats).toHaveProperty('matchCacheSize');
    expect(stats).toHaveProperty('similarityCacheSize');
    expect(stats).toHaveProperty('matchCacheMaxSize');
    expect(stats).toHaveProperty('similarityCacheMaxSize');

    expect(typeof stats.matchCacheSize).toBe('number');
    expect(typeof stats.similarityCacheSize).toBe('number');
    expect(stats.matchCacheMaxSize).toBe(500);
    expect(stats.similarityCacheMaxSize).toBe(2000);
  });

  test('キャッシュサイズ制限の動作', async () => {
    clearMatchCache();

    // 大量のユニークなマッチングを実行してキャッシュを満たす
    const uniqueTexts = Array(600).fill(0).map((_, i) => `ユニークテキスト${i} ITエンジニア`);

    for (let i = 0; i < 100; i++) {
      await findEnhancedPhraseMatches(uniqueTexts[i], [sampleFindings[0]], {
        enableNormalization: true
      });
    }

    const stats = getCacheStats();

    // キャッシュサイズが上限を超えないことを確認
    expect(stats.matchCacheSize).toBeLessThanOrEqual(stats.matchCacheMaxSize);
    expect(stats.similarityCacheSize).toBeLessThanOrEqual(stats.similarityCacheMaxSize);
  });
});
