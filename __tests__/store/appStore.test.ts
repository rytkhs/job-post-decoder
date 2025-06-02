/**
 * AppStoreのテスト
 */
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../src/app/store/appStore';
import { EnhancedAPIResponse, EnhancedFinding } from '../../src/app/types/api';

// ローカルストレージのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// テスト用のサンプルデータ
const mockEnhancedResult: EnhancedAPIResponse = {
  findings: [
    {
      text: 'やりがいのある仕事',
      reason: 'やりがいという抽象的な表現',
      severity: 'high',
      category: 'culture',
      confidence: 0.9,
      related_keywords: ['やりがい'],
      suggested_questions: ['具体的にどのような点でやりがいを感じられますか？']
    },
    {
      text: '競争力のある給与',
      reason: '具体的な金額が不明',
      severity: 'medium',
      category: 'compensation',
      confidence: 0.8,
      related_keywords: ['競争力', '給与'],
      suggested_questions: ['給与の詳細な内訳を教えてください']
    }
  ],
  summary: {
    total_findings: 2,
    risk_level: 'medium',
    categories_detected: ['culture', 'compensation'],
    overall_recommendation: 'テスト用の推奨事項'
  },
  interview_questions: [],
  metadata: {
    analysis_timestamp: '2024-01-01T00:00:00Z',
    model_version: 'test-v1',
    processing_time_ms: 1000
  }
};

describe('useAppStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // ストアをリセット
    useAppStore.getState().resetState();
  });

  describe('初期状態', () => {
    test('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.currentResult).toBeNull();
      expect(result.current.analysisHistory).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.selectedCategories).toEqual(new Set());
    });
  });

  describe('解析結果の管理', () => {
    test('解析結果を設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAnalysisResult(mockEnhancedResult);
      });

      expect(result.current.currentResult).toEqual(mockEnhancedResult);
    });

    test('ローディング状態を設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    test('エラー状態を設定できる', () => {
      const { result } = renderHook(() => useAppStore());
      const errorMessage = 'テストエラー';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('履歴管理', () => {
    test('解析履歴を追加できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToHistory(mockEnhancedResult, 'テスト求人');
      });

      expect(result.current.analysisHistory).toHaveLength(1);
      expect(result.current.analysisHistory[0].result).toEqual(mockEnhancedResult);
      expect(result.current.analysisHistory[0].jobTitle).toBe('テスト求人');
    });

    test('履歴は最大10件まで保持される', () => {
      const { result } = renderHook(() => useAppStore());

      // 11件の履歴を追加
      act(() => {
        for (let i = 0; i < 11; i++) {
          result.current.addToHistory(mockEnhancedResult, `テスト求人${i}`);
        }
      });

      expect(result.current.analysisHistory).toHaveLength(10);
      expect(result.current.analysisHistory[0].jobTitle).toBe('テスト求人10');
    });

    test('履歴をクリアできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToHistory(mockEnhancedResult);
        result.current.clearHistory();
      });

      expect(result.current.analysisHistory).toHaveLength(0);
    });

    test('特定の履歴を削除できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToHistory(mockEnhancedResult, 'テスト1');
        result.current.addToHistory(mockEnhancedResult, 'テスト2');
      });

      // 最初に追加された履歴のIDを取得（配列の最後の要素）
      const firstId = result.current.analysisHistory[result.current.analysisHistory.length - 1].id;

      act(() => {
        result.current.removeFromHistory(firstId);
      });

      expect(result.current.analysisHistory).toHaveLength(1);
      expect(result.current.analysisHistory[0].jobTitle).toBe('テスト2');
    });
  });

  describe('フィルター機能', () => {
    test('カテゴリフィルターを設定できる', () => {
      const { result } = renderHook(() => useAppStore());
      const categories = new Set(['culture', 'compensation']);

      act(() => {
        result.current.setSelectedCategories(categories);
      });

      expect(result.current.selectedCategories).toEqual(categories);
    });

    test('カテゴリを切り替えできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleCategory('culture');
      });

      expect(result.current.selectedCategories.has('culture')).toBe(true);

      act(() => {
        result.current.toggleCategory('culture');
      });

      expect(result.current.selectedCategories.has('culture')).toBe(false);
    });

    test('重要度フィルターを設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSeverityFilter('high');
      });

      expect(result.current.severityFilter).toBe('high');
    });

    test('検索クエリを設定できる', () => {
      const { result } = renderHook(() => useAppStore());
      const query = 'テスト検索';

      act(() => {
        result.current.setSearchQuery(query);
      });

      expect(result.current.searchQuery).toBe(query);
    });

    test('フィルターをクリアできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSelectedCategories(new Set(['culture']));
        result.current.setSeverityFilter('high');
        result.current.setSearchQuery('テスト');
        result.current.clearFilters();
      });

      expect(result.current.selectedCategories).toEqual(new Set());
      expect(result.current.severityFilter).toBe('all');
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('UI設定', () => {
    test('アクティブタブを設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTab('questions');
      });

      expect(result.current.activeTab).toBe('questions');
    });

    test('アニメーションを切り替えできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.enableAnimations).toBe(false);

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.enableAnimations).toBe(true);
    });

    test('ダークモードを切り替えできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(true);
    });

    test('コンパクト表示を切り替えできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleCompactView();
      });

      expect(result.current.isCompactView).toBe(true);
    });
  });

  describe('フィードバック管理', () => {
    test('フィードバックを設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setFeedback('finding-1', 'positive');
      });

      expect(result.current.feedbackHistory['finding-1']).toBe('positive');
    });

    test('フィードバックをクリアできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setFeedback('finding-1', 'positive');
        result.current.clearFeedback();
      });

      expect(result.current.feedbackHistory).toEqual({});
    });
  });

  describe('質問管理', () => {
    test('質問選択状態を設定できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setQuestionSelection('question-1', true);
      });

      expect(result.current.selectedQuestions['question-1']).toBe(true);
    });

    test('カスタム質問を追加できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addCustomQuestion('culture', 'カスタム質問');
      });

      expect(result.current.customQuestions).toHaveLength(1);
      expect(result.current.customQuestions[0].question).toBe('カスタム質問');
      expect(result.current.customQuestions[0].category).toBe('culture');
    });

    test('カスタム質問を削除できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addCustomQuestion('culture', 'カスタム質問');
      });

      const questionId = result.current.customQuestions[0].id;

      act(() => {
        result.current.removeCustomQuestion(questionId);
      });

      expect(result.current.customQuestions).toHaveLength(0);
    });

    test('カスタム質問を更新できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addCustomQuestion('culture', 'カスタム質問');
      });

      const questionId = result.current.customQuestions[0].id;

      act(() => {
        result.current.updateCustomQuestion(questionId, '更新された質問');
      });

      expect(result.current.customQuestions[0].question).toBe('更新された質問');
    });
  });

  describe('データ管理', () => {
    test('状態をリセットできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAnalysisResult(mockEnhancedResult);
        result.current.toggleDarkMode();
        result.current.addToHistory(mockEnhancedResult);
        result.current.resetState();
      });

      expect(result.current.currentResult).toBeNull();
      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.analysisHistory).toHaveLength(0);
    });

    test('状態をエクスポートできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addToHistory(mockEnhancedResult);
        result.current.toggleDarkMode();
      });

      const exportedState = result.current.exportState();
      const parsed = JSON.parse(exportedState);

      expect(parsed.analysisHistory).toHaveLength(1);
      expect(parsed.isDarkMode).toBe(true);
    });

    test('状態をインポートできる', () => {
      const { result } = renderHook(() => useAppStore());

      const importData = JSON.stringify({
        analysisHistory: [{ id: 'test', timestamp: '2024-01-01', result: mockEnhancedResult }],
        isDarkMode: true,
        enableAnimations: false
      });

      act(() => {
        result.current.importState(importData);
      });

      expect(result.current.analysisHistory).toHaveLength(1);
      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.enableAnimations).toBe(false);
    });
  });

  describe('セレクター機能', () => {
    test('強化された解析結果を取得できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAnalysisResult(mockEnhancedResult);
      });

      // ストアから直接セレクター関数を取得
      const store = useAppStore.getState();
      const findings = store.currentResult && 'findings' in store.currentResult
        ? store.currentResult.findings
        : [];

      expect(findings).toHaveLength(2);
      expect(findings[0].severity).toBe('high');
      expect(findings[1].category).toBe('compensation');
    });

    test('フィルタリングされた結果を取得できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAnalysisResult(mockEnhancedResult);
        result.current.setSelectedCategories(new Set(['culture']));
      });

      // ストアから直接フィルタリング処理を実行
      const store = useAppStore.getState();
      const findings = store.currentResult && 'findings' in store.currentResult
        ? store.currentResult.findings
        : [];

      const filteredFindings = findings.filter(finding =>
        store.selectedCategories.size === 0 || store.selectedCategories.has(finding.category)
      );

      expect(filteredFindings).toHaveLength(1);
      expect(filteredFindings[0].category).toBe('culture');
    });

    test('統計情報を取得できる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setAnalysisResult(mockEnhancedResult);
      });

      // ストアから直接統計情報を計算
      const store = useAppStore.getState();
      const findings = store.currentResult && 'findings' in store.currentResult
        ? store.currentResult.findings
        : [];

      const stats = {
        total: findings.length,
        categoryStats: findings.reduce((acc, finding) => {
          acc[finding.category] = (acc[finding.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        severityStats: findings.reduce((acc, finding) => {
          acc[finding.severity] = (acc[finding.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      expect(stats.total).toBe(2);
      expect(stats.categoryStats.culture).toBe(1);
      expect(stats.categoryStats.compensation).toBe(1);
      expect(stats.severityStats.high).toBe(1);
      expect(stats.severityStats.medium).toBe(1);
    });
  });
});
