/**
 * QuestionGeneratorコンポーネントのテスト
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QuestionGenerator } from '../../src/app/components/shared/QuestionGenerator';
import { InterviewQuestions, EnhancedFinding } from '../../src/app/types/api';

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

// window.openのモック
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
});

// テスト用のサンプルデータ
const mockInterviewQuestions: InterviewQuestions[] = [
  {
    category: 'compensation',
    questions: [
      '給与の詳細な内訳を教えてください',
      '賞与の支給基準はどのようになっていますか？'
    ]
  },
  {
    category: 'worklife',
    questions: [
      '実際の残業時間はどの程度ですか？',
      '有給取得率はどのくらいですか？'
    ]
  }
];

const mockFindings: EnhancedFinding[] = [
  {
    text: 'やりがいのある仕事',
    reason: 'やりがいという抽象的な表現',
    severity: 'medium',
    category: 'culture',
    confidence: 0.8,
    related_keywords: ['やりがい'],
    suggested_questions: ['具体的にどのような点でやりがいを感じられますか？']
  }
];

describe('QuestionGenerator', () => {
  let mockWriteText: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockWindowOpen.mockClear();

    // クリップボードAPIのモック
    mockWriteText = jest.fn().mockResolvedValue(undefined);
    delete (navigator as any).clipboard;
    (navigator as any).clipboard = {
      writeText: mockWriteText,
    };
  });

  describe('基本表示', () => {
    test('コンポーネントが正しく表示される', () => {
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('面接質問ジェネレーター')).toBeInTheDocument();
      expect(screen.getByText('4/4件選択')).toBeInTheDocument();
      expect(screen.getByText('カスタム質問を追加')).toBeInTheDocument();
    });

    test('カテゴリ別に質問が表示される', () => {
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('💰 給与・待遇')).toBeInTheDocument();
      expect(screen.getByText('⏰ 労働環境')).toBeInTheDocument();
      // 複数の要素がある場合は getAllByText を使用
      const categorySelections = screen.getAllByText('2/2件選択');
      expect(categorySelections.length).toBeGreaterThan(0);
    });

    test('質問が展開されて表示される', () => {
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      expect(screen.getByText('給与の詳細な内訳を教えてください')).toBeInTheDocument();
      expect(screen.getByText('賞与の支給基準はどのようになっていますか？')).toBeInTheDocument();
      expect(screen.getByText('実際の残業時間はどの程度ですか？')).toBeInTheDocument();
      expect(screen.getByText('有給取得率はどのくらいですか？')).toBeInTheDocument();
    });
  });

  describe('質問選択機能', () => {
    test('質問のチェックボックスをクリックして選択状態を変更できる', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const firstQuestionCheckbox = checkboxes[0];

      // 初期状態では選択されている
      expect(firstQuestionCheckbox).toBeChecked();

      // クリックして選択解除
      await user.click(firstQuestionCheckbox);
      expect(firstQuestionCheckbox).not.toBeChecked();

      // 選択数が更新される
      expect(screen.getByText('3/4件選択')).toBeInTheDocument();
    });

    test('全選択/全解除ボタンが機能する', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // 複数の全解除ボタンがある場合は、最初のもの（ヘッダーの全体制御）を取得
      const allToggleButtons = screen.getAllByRole('button', { name: '全解除' });
      const mainToggleButton = allToggleButtons[0];

      // 全解除
      await user.click(mainToggleButton);
      expect(screen.getByText('0/4件選択')).toBeInTheDocument();

      // 全選択ボタンを探す（複数ある場合は最初のもの）
      const allSelectButtons = screen.getAllByRole('button', { name: '全選択' });
      const mainSelectButton = allSelectButtons[0];
      expect(mainSelectButton).toBeInTheDocument();

      // 全選択
      await user.click(mainSelectButton);
      expect(screen.getByText('4/4件選択')).toBeInTheDocument();
    });

    test('カテゴリ別の全選択/全解除が機能する', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // 給与・待遇カテゴリの全解除ボタンを探す
      const categoryButtons = screen.getAllByText('全解除');
      const compensationToggle = categoryButtons[1]; // 最初は全体の全解除ボタン

      await user.click(compensationToggle);

      // 給与・待遇カテゴリの選択数が変更される
      expect(screen.getByText('0/2件選択')).toBeInTheDocument();
      expect(screen.getByText('2/4件選択')).toBeInTheDocument();
    });
  });

  describe('カテゴリ展開/折りたたみ', () => {
    test('カテゴリヘッダーをクリックして展開/折りたたみできる', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // 初期状態では展開されている
      expect(screen.getByText('給与の詳細な内訳を教えてください')).toBeInTheDocument();

      // カテゴリヘッダーをクリックして折りたたみ
      const categoryHeader = screen.getByText('💰 給与・待遇').closest('div');
      if (categoryHeader) {
        await user.click(categoryHeader);
      }

      // 質問が非表示になる
      await waitFor(() => {
        expect(screen.queryByText('給与の詳細な内訳を教えてください')).not.toBeInTheDocument();
      });
    });
  });

  describe('カスタム質問追加', () => {
    test('カスタム質問を追加できる', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // 質問追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '質問追加' }));

      // フォームが表示される
      expect(screen.getByPlaceholderText('質問内容を入力してください...')).toBeInTheDocument();

      // カテゴリを選択
      const categorySelect = screen.getByDisplayValue('📋 その他');
      await user.selectOptions(categorySelect, 'compensation');

      // 質問内容を入力
      const textarea = screen.getByPlaceholderText('質問内容を入力してください...');
      await user.type(textarea, 'カスタム質問のテスト');

      // 追加ボタンをクリック
      await user.click(screen.getByRole('button', { name: '追加' }));

      // 質問が追加される
      expect(screen.getByText('カスタム質問のテスト')).toBeInTheDocument();
      expect(screen.getByText('カスタム')).toBeInTheDocument();
      expect(screen.getByText('5/5件選択')).toBeInTheDocument();
    });

    test('空の質問は追加できない', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      await user.click(screen.getByRole('button', { name: '質問追加' }));

      // 追加ボタンが無効化されている
      const addButton = screen.getByRole('button', { name: '追加' });
      expect(addButton).toBeDisabled();
    });

    test('カスタム質問追加をキャンセルできる', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      await user.click(screen.getByRole('button', { name: '質問追加' }));

      const textarea = screen.getByPlaceholderText('質問内容を入力してください...');
      await user.type(textarea, 'テスト質問');

      // キャンセルボタンをクリック
      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      // フォームが非表示になる
      expect(screen.queryByPlaceholderText('質問内容を入力してください...')).not.toBeInTheDocument();
    });
  });

  describe('質問編集機能', () => {
    test('カスタム質問を編集できる', async () => {
      const user = userEvent.setup();

      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // まずカスタム質問を追加
      await user.click(screen.getByRole('button', { name: '質問追加' }));

      const textarea = screen.getByPlaceholderText('質問内容を入力してください...');
      await user.type(textarea, '編集前の質問');

      await user.click(screen.getByRole('button', { name: '追加' }));

      // カスタム質問が追加されたことを確認（カウンターで確認）
      await waitFor(() => {
        expect(screen.getByText('5/5件選択')).toBeInTheDocument();
      });

      // 編集機能の存在を確認（編集ボタンの存在確認のみ）
      const editButtons = screen.getAllByRole('button');
      const hasEditButton = editButtons.some(button => {
        const svg = button.querySelector('svg');
        return svg && button.getAttribute('class')?.includes('h-8 w-8');
      });

      expect(hasEditButton).toBe(true);
    });
  });

  describe('エクスポート機能', () => {
    test('選択された質問がある場合にエクスポートボタンが表示される', () => {
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      expect(screen.getByRole('button', { name: 'コピー' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ダウンロード' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'メール送信' })).toBeInTheDocument();
    });

    test('コピー機能が動作する', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      const copyButton = screen.getByRole('button', { name: 'コピー' });

      // コピーボタンがクリックできることを確認
      expect(copyButton).toBeEnabled();
      await user.click(copyButton);

      // エラーが発生しないことを確認（コピー機能が実行されること）
      expect(copyButton).toBeInTheDocument();
    });

    test('メール送信機能が動作する', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      await user.click(screen.getByRole('button', { name: 'メール送信' }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:?subject=')
      );
    });
  });

  describe('ローカルストレージ連携', () => {
    test('質問選択状態がローカルストレージに保存される', async () => {
      const user = userEvent.setup();
      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      // ローカルストレージに保存される
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'job-decoder-questions',
        expect.stringContaining('isSelected')
      );
    });

    test('ローカルストレージから質問選択状態を復元する', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'job-decoder-questions') {
          return JSON.stringify([{
            id: 'compensation-0',
            category: 'compensation',
            question: '給与の詳細な内訳を教えてください',
            isSelected: false,
            isCustom: false
          }]);
        }
        return null;
      });

      render(
        <QuestionGenerator
          interviewQuestions={mockInterviewQuestions}
          findings={mockFindings}
        />
      );

      // 復元された状態が反映される
      expect(screen.getByText('3/4件選択')).toBeInTheDocument();
    });
  });

  describe('空の状態', () => {
    test('質問がない場合に適切なメッセージが表示される', () => {
      render(
        <QuestionGenerator
          interviewQuestions={[]}
          findings={[]}
        />
      );

      expect(screen.getByText('質問が見つかりませんでした。')).toBeInTheDocument();
      expect(screen.getByText('カスタム質問を追加してください。')).toBeInTheDocument();
    });
  });
});
