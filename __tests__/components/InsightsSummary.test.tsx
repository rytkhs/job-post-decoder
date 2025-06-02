/**
 * InsightsSummaryコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InsightsSummary } from '../../src/app/components/results/InsightsSummary';
import { EnhancedAPIResponse, EnhancedFinding } from '../../src/app/types/api';

// テスト用のサンプルデータ
const mockAnalysisResult: EnhancedAPIResponse = {
  findings: [],
  summary: {
    total_findings: 5,
    risk_level: 'medium',
    categories_detected: ['compensation', 'worklife', 'culture'],
    overall_recommendation: '面接で詳細な確認を行い、企業研究を十分に実施することをお勧めします。'
  },
  interview_questions: [],
  metadata: {
    analysis_timestamp: '2024-01-01T00:00:00Z',
    model_version: 'test-v1',
    processing_time_ms: 1000
  }
};

const mockFindings: EnhancedFinding[] = [
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
  },
  {
    text: 'フレキシブルな働き方',
    reason: '具体的な制度が不明',
    severity: 'low',
    category: 'worklife',
    confidence: 0.7,
    related_keywords: ['フレキシブル'],
    suggested_questions: ['具体的にどのような働き方が可能ですか？']
  },
  {
    text: '成長できる環境',
    reason: '成長の具体性が不明',
    severity: 'medium',
    category: 'growth',
    confidence: 0.8,
    related_keywords: ['成長'],
    suggested_questions: ['どのような成長機会がありますか？']
  },
  {
    text: 'アットホームな職場',
    reason: '職場環境の具体性が不明',
    severity: 'high',
    category: 'culture',
    confidence: 0.9,
    related_keywords: ['アットホーム'],
    suggested_questions: ['職場の雰囲気について詳しく教えてください']
  }
];

describe('InsightsSummary', () => {
  describe('基本表示', () => {
    test('コンポーネントが正しく表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('総合リスク評価')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ別分析')).toBeInTheDocument();
      expect(screen.getByText('重要度別統計')).toBeInTheDocument();
      expect(screen.getByText('推奨アクション')).toBeInTheDocument();
    });

    test('リスクスコアが正しく計算される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      // リスクスコアの計算: (3*2 + 2*2 + 1*1) / (3*5) * 100 = 73%
      expect(screen.getByText('73')).toBeInTheDocument();
      expect(screen.getByText('高リスク')).toBeInTheDocument();
    });

    test('全体評価が表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('全体評価')).toBeInTheDocument();
      expect(screen.getByText('5件の懸念事項')).toBeInTheDocument();
    });

    test('検出カテゴリ数が表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('検出カテゴリ')).toBeInTheDocument();
      expect(screen.getByText('全5カテゴリ中')).toBeInTheDocument();
    });
  });

  describe('カテゴリ別分析', () => {
    test('カテゴリ別の統計が正しく表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      // 企業文化カテゴリ（2件）
      expect(screen.getByText('🏢 企業文化')).toBeInTheDocument();
      expect(screen.getByText('2件の懸念')).toBeInTheDocument();

      // 給与・待遇カテゴリ（1件）
      expect(screen.getByText('💰 給与・待遇')).toBeInTheDocument();
      expect(screen.getByText('1件の懸念')).toBeInTheDocument();

      // 労働環境カテゴリ（1件）
      expect(screen.getByText('⏰ 労働環境')).toBeInTheDocument();

      // 成長機会カテゴリ（1件）
      expect(screen.getByText('📈 成長機会')).toBeInTheDocument();
    });

    test('最も注意が必要な分野が表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('最も注意が必要な分野')).toBeInTheDocument();
      expect(screen.getByText('🏢 企業文化で2件の懸念が検出されました。')).toBeInTheDocument();
    });

    test('カテゴリ別の重要度統計が表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      // 企業文化カテゴリの重要度内訳
      const cultureCards = screen.getAllByText('🏢 企業文化');
      expect(cultureCards.length).toBeGreaterThan(0);

      // 高リスクと中リスクの表示
      expect(screen.getAllByText('高リスク')).toHaveLength(2); // SeverityBadgeとカテゴリ統計
      expect(screen.getAllByText('中リスク')).toHaveLength(2);
      expect(screen.getAllByText('低リスク')).toHaveLength(1);
    });
  });

  describe('重要度別統計', () => {
    test('重要度別の統計が正しく表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      // 高リスク: 2件 (40%)
      expect(screen.getByText('2件 (40%)')).toBeInTheDocument();

      // 中リスク: 2件 (40%)
      expect(screen.getAllByText('2件 (40%)')).toHaveLength(2);

      // 低リスク: 1件 (20%)
      expect(screen.getByText('1件 (20%)')).toBeInTheDocument();
    });

    test('重要度順でソートされて表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      const severityLabels = screen.getAllByText(/リスク$/);
      // 高リスク、中リスク、低リスクの順で表示される
      expect(severityLabels[0]).toHaveTextContent('高リスク');
      expect(severityLabels[1]).toHaveTextContent('中リスク');
      expect(severityLabels[2]).toHaveTextContent('低リスク');
    });
  });

  describe('推奨アクション', () => {
    test('推奨アクションが生成される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('推奨アクション')).toBeInTheDocument();

      // 高リスク項目に関する推奨事項
      expect(screen.getByText(/2件の高リスク項目について、面接で詳細な確認を行ってください。/)).toBeInTheDocument();

      // 多数の懸念事項に関する推奨事項
      expect(screen.getByText(/多数の懸念事項が検出されました。企業研究を十分に行い、面接で積極的に質問することをお勧めします。/)).toBeInTheDocument();
    });

    test('総合的な推奨事項が表示される', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('💡 総合的な推奨事項')).toBeInTheDocument();
      expect(screen.getByText(mockAnalysisResult.summary.overall_recommendation)).toBeInTheDocument();
    });

    test('推奨アクションに番号が付けられる', () => {
      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    test('懸念事項がない場合', () => {
      const emptyResult = {
        ...mockAnalysisResult,
        summary: {
          ...mockAnalysisResult.summary,
          total_findings: 0,
          categories_detected: []
        }
      };

      render(
        <InsightsSummary
          analysisResult={emptyResult}
          findings={[]}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument(); // リスクスコア
      expect(screen.getByText('0件の懸念事項')).toBeInTheDocument();
      expect(screen.getByText('検出された懸念事項は比較的少ないですが、面接では具体的な例を聞いて詳細を確認しましょう。')).toBeInTheDocument();
    });

    test('単一カテゴリのみの場合', () => {
      const singleCategoryFindings = [mockFindings[0]];
      const singleCategoryResult = {
        ...mockAnalysisResult,
        summary: {
          ...mockAnalysisResult.summary,
          total_findings: 1,
          categories_detected: ['culture']
        }
      };

      render(
        <InsightsSummary
          analysisResult={singleCategoryResult}
          findings={singleCategoryFindings}
        />
      );

      expect(screen.getByText('🏢 企業文化')).toBeInTheDocument();
      expect(screen.getByText('1件の懸念')).toBeInTheDocument();
    });

    test('低リスクのみの場合', () => {
      const lowRiskFindings = [
        {
          ...mockFindings[0],
          severity: 'low' as const
        }
      ];

      render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={lowRiskFindings}
        />
      );

      expect(screen.getByText('33')).toBeInTheDocument(); // リスクスコア: 1/3 * 100 = 33%
      expect(screen.getByText('低リスク')).toBeInTheDocument();
    });
  });

  describe('カスタムクラス名', () => {
    test('カスタムクラス名が適用される', () => {
      const { container } = render(
        <InsightsSummary
          analysisResult={mockAnalysisResult}
          findings={mockFindings}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
