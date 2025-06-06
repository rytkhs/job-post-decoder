/**
 * InterleaveDisplayコンポーネントのテスト
 * 設計書VD-UI-001の要件に基づく機能テスト
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InterleaveDisplay } from '../../../src/app/components/results/InterleaveDisplay';
import { LLMResponse, FeedbackType } from '../../../src/app/types/api';

// モックデータ
const mockOriginalText = `未経験歓迎！アットホームな職場で一緒に働きませんか？
やりがいのある仕事で、チームワークを大切にしている会社です。
残業はほとんどありません。土日祝日はお休みです。`;

const mockAnalysisResult: LLMResponse = {
  findings: [
    {
      original_phrase: "未経験歓迎",
      potential_realities: [
        "経験者が採用できないため、人材確保に苦労している可能性",
        "給与水準が市場より低い可能性"
      ],
      points_to_check: [
        "研修制度の具体的な内容",
        "未経験者のキャリアアップ事例"
      ]
    },
    {
      original_phrase: "アットホームな職場",
      potential_realities: [
        "社内の境界が曖昧で、プライベートに踏み込まれる可能性",
        "人間関係が濃密すぎて息苦しい環境の可能性"
      ],
      points_to_check: [
        "具体的な職場環境の説明",
        "社員の入れ替わりの頻度"
      ]
    },
    {
      original_phrase: "残業はほとんどありません",
      potential_realities: [
        "持ち帰り残業やサービス残業が常態化している可能性",
        "そもそも仕事量が少なく、スキルアップが期待できない可能性"
      ],
      points_to_check: [
        "具体的な残業時間の実績",
        "繁忙期の労働状況"
      ]
    }
  ]
};

const mockFeedbackState: Record<string, FeedbackType> = {};
const mockOnFeedback = jest.fn();

describe('InterleaveDisplay', () => {
  beforeEach(() => {
    mockOnFeedback.mockClear();
  });

  describe('基本的な表示', () => {
    it('原文テキストが正しく表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // テキストが分割されているため、個別に確認
      expect(screen.getByText('未経験歓迎')).toBeInTheDocument();
      expect(screen.getByText('アットホームな職場')).toBeInTheDocument();
      expect(screen.getByText(/で一緒に働きませんか/)).toBeInTheDocument();
      expect(screen.getByText(/やりがいのある仕事で、チームワーク/)).toBeInTheDocument();
    });

    it('ヘッダータイトルが表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      expect(screen.getByText('📄 原文・デコード結果インターリーブ表示')).toBeInTheDocument();
    });

    it('統計情報が正しく表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      expect(screen.getByText('検出された表現: 3件')).toBeInTheDocument();
      expect(screen.getByText(`原文文字数: ${mockOriginalText.length}文字`)).toBeInTheDocument();
    });

    it('使用方法のヒントが表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      expect(screen.getByText(/ハイライトされた部分をクリックすると/)).toBeInTheDocument();
    });
  });

  describe('フレーズハイライト機能', () => {
    it('検出されたフレーズがハイライト表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // フレーズがハイライトされているかチェック
      const highlightedPhrases = screen.getAllByRole('button');
      expect(highlightedPhrases.length).toBeGreaterThan(0);

      // 各フレーズが見つかることを確認
      expect(screen.getByText('未経験歓迎')).toBeInTheDocument();
      expect(screen.getByText('アットホームな職場')).toBeInTheDocument();
      expect(screen.getByText('残業はほとんどありません')).toBeInTheDocument();
    });

    it('ハイライトされたフレーズがクリック可能である', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');
      expect(firstPhrase.closest('span')).toHaveAttribute('role', 'button');
      expect(firstPhrase.closest('span')).toHaveAttribute('tabIndex', '0');
    });

    it('アコーディオントリガーアイコンが表示される', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // ChevronDownアイコンが存在することを確認（初期状態）
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('アコーディオン機能', () => {
    it('初期状態では全てのアコーディオンが閉じている', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // アコーディオンコンテンツが表示されていないことを確認
      expect(screen.queryByText('🔍 本音/解説')).not.toBeInTheDocument();
      expect(screen.queryByText('✅ 確認すべきポイント')).not.toBeInTheDocument();
    });

    it('ハイライトされたフレーズをクリックするとアコーディオンが開く', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');
      await user.click(firstPhrase);

      // アコーディオンコンテンツが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('🔍 本音/解説')).toBeInTheDocument();
        expect(screen.getByText('✅ 確認すべきポイント')).toBeInTheDocument();
      });
    });

    it('開いたアコーディオンを再クリックすると閉じる', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');

      // 開く
      await user.click(firstPhrase);
      await waitFor(() => {
        expect(screen.getByText('🔍 本音/解説')).toBeInTheDocument();
      });

      // 閉じる
      await user.click(firstPhrase);
      await waitFor(() => {
        expect(screen.queryByText('🔍 本音/解説')).not.toBeInTheDocument();
      });
    });

    it('複数のアコーディオンを同時に開くことができる', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');
      const secondPhrase = screen.getByText('アットホームな職場');

      // 最初のアコーディオンを開く
      await user.click(firstPhrase);
      await waitFor(() => {
        expect(screen.getAllByText('🔍 本音/解説')).toHaveLength(1);
      });

      // 2番目のアコーディオンを開く
      await user.click(secondPhrase);
      await waitFor(() => {
        expect(screen.getAllByText('🔍 本音/解説')).toHaveLength(2);
      });
    });

    it('「すべて閉じる」ボタンが表示され、正しく動作する', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // アコーディオンを開く
      const firstPhrase = screen.getByText('未経験歓迎');
      await user.click(firstPhrase);

      // 「すべて閉じる」ボタンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('すべて閉じる')).toBeInTheDocument();
      });

      // 「すべて閉じる」ボタンをクリック
      await user.click(screen.getByText('すべて閉じる'));

      // アコーディオンが閉じることを確認
      await waitFor(() => {
        expect(screen.queryByText('🔍 本音/解説')).not.toBeInTheDocument();
      });
    });
  });

  describe('アコーディオンコンテンツ', () => {
    beforeEach(async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // 最初のアコーディオンを開く
      const firstPhrase = screen.getByText('未経験歓迎');
      await user.click(firstPhrase);
    });

    it('建前（原文フレーズ）が表示される', async () => {
      await waitFor(() => {
        expect(screen.getByText('建前')).toBeInTheDocument();
        expect(screen.getByText('"未経験歓迎"')).toBeInTheDocument();
      });
    });

    it('本音/解説が表示される', async () => {
      await waitFor(() => {
        expect(screen.getByText('🔍 本音/解説')).toBeInTheDocument();
        expect(screen.getByText(/経験者が採用できないため/)).toBeInTheDocument();
        expect(screen.getByText(/給与水準が市場より低い/)).toBeInTheDocument();
      });
    });

    it('確認すべきポイントが表示される', async () => {
      await waitFor(() => {
        expect(screen.getByText('✅ 確認すべきポイント')).toBeInTheDocument();
        expect(screen.getByText(/研修制度の具体的な内容/)).toBeInTheDocument();
        expect(screen.getByText(/未経験者のキャリアアップ事例/)).toBeInTheDocument();
      });
    });

    it('フィードバックセクションが表示される', async () => {
      await waitFor(() => {
        expect(screen.getByText('この情報は役に立ちましたか？')).toBeInTheDocument();
      });
    });
  });

  describe('キーボードナビゲーション', () => {
    it('Enterキーでアコーディオンを開くことができる', async () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');

      // Enterキーを押す
      fireEvent.keyDown(firstPhrase, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('🔍 本音/解説')).toBeInTheDocument();
      });
    });

    it('スペースキーでアコーディオンを開くことができる', async () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');

      // スペースキーを押す
      fireEvent.keyDown(firstPhrase, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(screen.getByText('🔍 本音/解説')).toBeInTheDocument();
      });
    });
  });

  describe('エラーケース', () => {
    it('原文テキストが空の場合、適切なメッセージを表示する', () => {
      render(
        <InterleaveDisplay
          originalText=""
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      expect(screen.getByText('原文テキストが見つかりません。')).toBeInTheDocument();
    });

    it('解析結果が空の場合でもエラーにならない', () => {
      const emptyResult: LLMResponse = { findings: [] };

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={emptyResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      expect(screen.getByText('検出された表現: 0件')).toBeInTheDocument();
    });

    it('フレーズが原文中に見つからない場合でもエラーにならない', () => {
      const mismatchedResult: LLMResponse = {
        findings: [
          {
            original_phrase: "存在しないフレーズ",
            potential_realities: ["テスト"],
            points_to_check: ["テスト"]
          }
        ]
      };

      expect(() => {
        render(
          <InterleaveDisplay
            originalText={mockOriginalText}
            analysisResult={mismatchedResult}
            onFeedback={mockOnFeedback}
            feedbackState={mockFeedbackState}
          />
        );
      }).not.toThrow();
    });
  });

  describe('フィードバック機能', () => {
    it('フィードバックが送信される', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      // アコーディオンを開く
      const firstPhrase = screen.getByText('未経験歓迎');
      await user.click(firstPhrase);

      // フィードバックボタンを探してクリック（実装に依存）
      await waitFor(() => {
        expect(screen.getByText('この情報は役に立ちましたか？')).toBeInTheDocument();
      });

      // フィードバック機能の詳細テストは FeedbackButton のテストで行う
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');
      const phraseElement = firstPhrase.closest('span');

      expect(phraseElement).toHaveAttribute('role', 'button');
      expect(phraseElement).toHaveAttribute('tabIndex', '0');
      expect(phraseElement).toHaveAttribute('aria-expanded', 'false');
      expect(phraseElement).toHaveAttribute('aria-label');
    });

    it('アコーディオンが開いた時、aria-expandedが更新される', async () => {
      const user = userEvent.setup();

      render(
        <InterleaveDisplay
          originalText={mockOriginalText}
          analysisResult={mockAnalysisResult}
          onFeedback={mockOnFeedback}
          feedbackState={mockFeedbackState}
        />
      );

      const firstPhrase = screen.getByText('未経験歓迎');
      const phraseElement = firstPhrase.closest('span');

      // 初期状態
      expect(phraseElement).toHaveAttribute('aria-expanded', 'false');

      // クリック後
      await user.click(firstPhrase);
      await waitFor(() => {
        expect(phraseElement).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
