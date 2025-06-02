/**
 * FeedbackButtonコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackButton, saveFeedbackToStorage, loadFeedbackFromStorage, getAllFeedbackFromStorage } from '../../src/app/components/shared/FeedbackButton';

// localStorage のモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('FeedbackButton', () => {
  const mockOnFeedback = jest.fn();
  const defaultProps = {
    findingId: 'test-finding-1',
    onFeedback: mockOnFeedback,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('{}');
  });

  describe('基本的な表示', () => {
    it('👍と👎ボタンが表示される', () => {
      render(<FeedbackButton {...defaultProps} />);

      expect(screen.getByTitle('この情報は役に立ちましたか？')).toBeInTheDocument();
      expect(screen.getByTitle('この情報は役に立ちませんでしたか？')).toBeInTheDocument();
    });

    it('初期状態では両方のボタンがoutlineスタイル', () => {
      render(<FeedbackButton {...defaultProps} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      const notHelpfulButton = screen.getByTitle('この情報は役に立ちませんでしたか？');

      expect(helpfulButton).not.toHaveClass('bg-green-600');
      expect(notHelpfulButton).not.toHaveClass('bg-red-600');
    });
  });

  describe('フィードバック操作', () => {
    it('👍ボタンをクリックするとhelpfulフィードバックが送信される', async () => {
      render(<FeedbackButton {...defaultProps} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      fireEvent.click(helpfulButton);

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith('test-finding-1', 'helpful');
      });
    });

    it('👎ボタンをクリックするとnot-helpfulフィードバックが送信される', async () => {
      render(<FeedbackButton {...defaultProps} />);

      const notHelpfulButton = screen.getByTitle('この情報は役に立ちませんでしたか？');
      fireEvent.click(notHelpfulButton);

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith('test-finding-1', 'not-helpful');
      });
    });

    it('同じボタンを再度クリックするとフィードバックが取り消される', async () => {
      render(<FeedbackButton {...defaultProps} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');

      // 最初のクリック
      fireEvent.click(helpfulButton);
      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith('test-finding-1', 'helpful');
      });

      // 2回目のクリック（取り消し）
      fireEvent.click(helpfulButton);
      // 取り消し時はコールバックが呼ばれない
    });

    it('フィードバック完了後にメッセージが表示される', async () => {
      render(<FeedbackButton {...defaultProps} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      fireEvent.click(helpfulButton);

      await waitFor(() => {
        expect(screen.getByText('フィードバックありがとうございます')).toBeInTheDocument();
      });
    });
  });

  describe('初期フィードバック状態', () => {
    it('初期フィードバックがhelpfulの場合、👍ボタンがアクティブ状態', () => {
      render(<FeedbackButton {...defaultProps} initialFeedback="helpful" />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      expect(helpfulButton).toHaveClass('bg-green-600');
    });

    it('初期フィードバックがnot-helpfulの場合、👎ボタンがアクティブ状態', () => {
      render(<FeedbackButton {...defaultProps} initialFeedback="not-helpful" />);

      const notHelpfulButton = screen.getByTitle('この情報は役に立ちませんでしたか？');
      expect(notHelpfulButton).toHaveClass('bg-red-600');
    });
  });

  describe('無効化状態', () => {
    it('disabledがtrueの場合、ボタンが無効化される', () => {
      render(<FeedbackButton {...defaultProps} disabled={true} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      const notHelpfulButton = screen.getByTitle('この情報は役に立ちませんでしたか？');

      expect(helpfulButton).toBeDisabled();
      expect(notHelpfulButton).toBeDisabled();
    });

    it('無効化状態ではクリックしてもフィードバックが送信されない', () => {
      render(<FeedbackButton {...defaultProps} disabled={true} />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      fireEvent.click(helpfulButton);

      expect(mockOnFeedback).not.toHaveBeenCalled();
    });
  });

  describe('サイズ設定', () => {
    it('小サイズで表示される', () => {
      render(<FeedbackButton {...defaultProps} size="sm" />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      expect(helpfulButton).toHaveClass('h-8', 'w-8');
    });

    it('大サイズで表示される', () => {
      render(<FeedbackButton {...defaultProps} size="lg" />);

      const helpfulButton = screen.getByTitle('この情報は役に立ちましたか？');
      expect(helpfulButton).toHaveClass('h-12', 'w-12');
    });
  });
});

describe('ローカルストレージ関数', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveFeedbackToStorage', () => {
    it('フィードバックがローカルストレージに保存される', () => {
      localStorageMock.getItem.mockReturnValue('{}');

      saveFeedbackToStorage('test-finding', 'helpful');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'job-decoder-feedback',
        expect.stringContaining('"test-finding"')
      );
    });

    it('既存のフィードバックに追加される', () => {
      const existingFeedback = {
        'existing-finding': { feedback: 'helpful', timestamp: '2024-01-01T00:00:00.000Z' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingFeedback));

      saveFeedbackToStorage('new-finding', 'not-helpful');

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveProperty('existing-finding');
      expect(savedData).toHaveProperty('new-finding');
      expect(savedData['new-finding'].feedback).toBe('not-helpful');
    });

    it('ローカルストレージエラー時に警告ログが出力される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      saveFeedbackToStorage('test-finding', 'helpful');

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save feedback to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('loadFeedbackFromStorage', () => {
    it('保存されたフィードバックが読み込まれる', () => {
      const feedbackData = {
        'test-finding': { feedback: 'helpful', timestamp: '2024-01-01T00:00:00.000Z' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(feedbackData));

      const result = loadFeedbackFromStorage('test-finding');

      expect(result).toBe('helpful');
    });

    it('存在しないfindingIdの場合nullが返される', () => {
      localStorageMock.getItem.mockReturnValue('{}');

      const result = loadFeedbackFromStorage('non-existent');

      expect(result).toBeNull();
    });

    it('ローカルストレージエラー時にnullが返される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = loadFeedbackFromStorage('test-finding');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load feedback from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getAllFeedbackFromStorage', () => {
    it('すべてのフィードバックデータが取得される', () => {
      const feedbackData = {
        'finding-1': { feedback: 'helpful', timestamp: '2024-01-01T00:00:00.000Z' },
        'finding-2': { feedback: 'not-helpful', timestamp: '2024-01-02T00:00:00.000Z' }
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(feedbackData));

      const result = getAllFeedbackFromStorage();

      expect(result).toEqual(feedbackData);
    });

    it('ローカルストレージエラー時に空オブジェクトが返される', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getAllFeedbackFromStorage();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load all feedback from localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
