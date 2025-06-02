/**
 * CategoryFilterコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryFilter, filterFindingsByCategory, useCategoryFilter } from '../../src/app/components/results/CategoryFilter';
import { EnhancedFinding } from '../../src/app/types/api';

// テスト用のモックデータ
const mockFindings: EnhancedFinding[] = [
  {
    original_phrase: "アットホームな職場",
    potential_realities: ["密な人間関係"],
    points_to_check: ["具体的な例を聞く"],
    severity: 'medium',
    category: 'culture',
    confidence: 0.8,
    related_keywords: ['職場環境'],
    suggested_questions: ['どのような点がアットホームですか？']
  },
  {
    original_phrase: "やりがいのある仕事",
    potential_realities: ["長時間労働の可能性"],
    points_to_check: ["労働時間を確認"],
    severity: 'high',
    category: 'worklife',
    confidence: 0.9,
    related_keywords: ['労働時間'],
    suggested_questions: ['残業時間はどの程度ですか？']
  },
  {
    original_phrase: "成長できる環境",
    potential_realities: ["研修制度が充実"],
    points_to_check: ["研修内容を確認"],
    severity: 'low',
    category: 'growth',
    confidence: 0.7,
    related_keywords: ['研修'],
    suggested_questions: ['どのような研修がありますか？']
  }
];

describe('CategoryFilter', () => {
  const mockOnCategoryChange = jest.fn();
  const defaultProps = {
    findings: mockFindings,
    selectedCategories: ['culture', 'worklife', 'growth'] as const,
    onCategoryChange: mockOnCategoryChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的な表示', () => {
    it('カテゴリフィルターのタイトルが表示される', () => {
      render(<CategoryFilter {...defaultProps} />);

      expect(screen.getByText('カテゴリフィルター')).toBeInTheDocument();
    });

    it('利用可能なカテゴリが表示される', () => {
      render(<CategoryFilter {...defaultProps} />);

      expect(screen.getByText('🏢 企業文化')).toBeInTheDocument();
      expect(screen.getByText('⏰ 労働環境')).toBeInTheDocument();
      expect(screen.getByText('📈 成長機会')).toBeInTheDocument();
    });

    it('各カテゴリの件数が表示される', () => {
      render(<CategoryFilter {...defaultProps} />);

      // 複数の「1件」があるので、getAllByTextを使用
      const countElements = screen.getAllByText('1件');
      expect(countElements).toHaveLength(3); // 3つのカテゴリそれぞれに1件
    });

    it('カテゴリの説明が表示される', () => {
      render(<CategoryFilter {...defaultProps} />);

      expect(screen.getByText('職場環境、社風、人間関係に関する表現')).toBeInTheDocument();
      expect(screen.getByText('勤務時間、残業、働き方に関する表現')).toBeInTheDocument();
      expect(screen.getByText('キャリア、スキルアップ、昇進に関する表現')).toBeInTheDocument();
    });
  });

  describe('カテゴリ選択', () => {
    it('カテゴリをクリックすると選択状態が切り替わる', () => {
      render(<CategoryFilter {...defaultProps} />);

      const cultureButton = screen.getByText('🏢 企業文化').closest('button');
      fireEvent.click(cultureButton!);

      expect(mockOnCategoryChange).toHaveBeenCalledWith(['worklife', 'growth']);
    });

    it('選択されたカテゴリにチェックマークが表示される', () => {
      render(<CategoryFilter {...defaultProps} />);

      // 選択されたカテゴリにチェックマークがあることを確認
      const cultureButton = screen.getByText('🏢 企業文化').closest('button');
      expect(cultureButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('全選択ボタンが機能する', () => {
      const props = {
        ...defaultProps,
        selectedCategories: ['culture'] as const
      };
      render(<CategoryFilter {...props} />);

      const selectAllButton = screen.getByText('全選択').closest('button');
      fireEvent.click(selectAllButton!);

      expect(mockOnCategoryChange).toHaveBeenCalledWith(['culture', 'worklife', 'growth']);
    });

    it('全解除ボタンが機能する', () => {
      render(<CategoryFilter {...defaultProps} />);

      const deselectAllButton = screen.getByText('全解除').closest('button');
      fireEvent.click(deselectAllButton!);

      expect(mockOnCategoryChange).toHaveBeenCalledWith([]);
    });

    it('リセットボタンが機能する', () => {
      const props = {
        ...defaultProps,
        selectedCategories: ['culture'] as const
      };
      render(<CategoryFilter {...props} />);

      const resetButton = screen.getByText('リセット').closest('button');
      fireEvent.click(resetButton!);

      expect(mockOnCategoryChange).toHaveBeenCalledWith(['culture', 'worklife', 'growth']);
    });
  });

  describe('コンパクト表示', () => {
    it('コンパクト表示でフィルターボタンが表示される', () => {
      render(<CategoryFilter {...defaultProps} compact={true} />);

      expect(screen.getByText('フィルター')).toBeInTheDocument();
    });

    it('フィルターボタンをクリックすると展開される', () => {
      render(<CategoryFilter {...defaultProps} compact={true} />);

      const filterButton = screen.getByText('フィルター').closest('button');
      fireEvent.click(filterButton!);

      expect(screen.getByText('🏢 企業文化')).toBeInTheDocument();
    });

    it('アクティブフィルターがある場合にバッジが表示される', () => {
      const props = {
        ...defaultProps,
        selectedCategories: ['culture', 'worklife'] as const,
        compact: true
      };
      render(<CategoryFilter {...props} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('フィルター状態表示', () => {
    it('フィルターが適用されている場合に状態が表示される', () => {
      const props = {
        ...defaultProps,
        selectedCategories: ['culture', 'worklife'] as const
      };
      render(<CategoryFilter {...props} />);

      // テキストが分割されているので、部分的にマッチさせる
      expect(screen.getByText(/2個のカテゴリを表示中/)).toBeInTheDocument();
      expect(screen.getByText(/全3カテゴリ中/)).toBeInTheDocument();
    });

    it('全カテゴリが選択されている場合は状態表示されない', () => {
      render(<CategoryFilter {...defaultProps} />);

      expect(screen.queryByText(/個のカテゴリを表示中/)).not.toBeInTheDocument();
    });
  });

  describe('件数が0のカテゴリ', () => {
    it('件数が0のカテゴリは表示されない', () => {
      const findingsWithoutCompensation = mockFindings.filter(f => f.category !== 'compensation');
      const props = {
        ...defaultProps,
        findings: findingsWithoutCompensation,
        selectedCategories: ['culture', 'worklife', 'growth'] as const
      };
      render(<CategoryFilter {...props} />);

      expect(screen.queryByText('💰 給与・待遇')).not.toBeInTheDocument();
    });
  });
});

describe('filterFindingsByCategory', () => {
  it('選択されたカテゴリの結果のみを返す', () => {
    const result = filterFindingsByCategory(mockFindings, ['culture', 'growth']);

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('culture');
    expect(result[1].category).toBe('growth');
  });

  it('空の選択カテゴリの場合は全ての結果を返す', () => {
    const result = filterFindingsByCategory(mockFindings, []);

    expect(result).toHaveLength(3);
    expect(result).toEqual(mockFindings);
  });

  it('存在しないカテゴリを選択した場合は空の配列を返す', () => {
    const result = filterFindingsByCategory(mockFindings, ['compensation']);

    expect(result).toHaveLength(0);
  });
});

// カスタムフックのテスト用コンポーネント
function TestComponent({ findings }: { findings: EnhancedFinding[] }) {
  const {
    selectedCategories,
    setSelectedCategories,
    filteredFindings,
    availableCategories
  } = useCategoryFilter(findings);

  return (
    <div>
      <div data-testid="selected-count">{selectedCategories.length}</div>
      <div data-testid="filtered-count">{filteredFindings.length}</div>
      <div data-testid="available-count">{availableCategories.length}</div>
      <button onClick={() => setSelectedCategories(['culture'])}>
        Select Culture Only
      </button>
    </div>
  );
}

describe('useCategoryFilter', () => {
  it('初期状態で全カテゴリが選択される', () => {
    render(<TestComponent findings={mockFindings} />);

    expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('3');
    expect(screen.getByTestId('available-count')).toHaveTextContent('3');
  });

  it('カテゴリ選択を変更できる', () => {
    render(<TestComponent findings={mockFindings} />);

    const button = screen.getByText('Select Culture Only');
    fireEvent.click(button);

    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('1');
  });

  it('findingsが変更されると利用可能なカテゴリが更新される', () => {
    const { rerender } = render(<TestComponent findings={mockFindings} />);

    expect(screen.getByTestId('available-count')).toHaveTextContent('3');

    const newFindings = mockFindings.slice(0, 2); // cultureとworklifeのみ
    rerender(<TestComponent findings={newFindings} />);

    expect(screen.getByTestId('available-count')).toHaveTextContent('2');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
  });
});
