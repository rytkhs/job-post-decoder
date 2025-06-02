/**
 * ErrorBoundary コンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorBoundary } from '../ErrorBoundary';

// テスト用のエラーを投げるコンポーネント
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// テスト用のコンポーネント
const TestComponent = () => <div>Test Component</div>;

// HOCのテスト用コンポーネント
const WrappedComponent = withErrorBoundary(TestComponent, {
  level: 'component'
});

// フックのテスト用コンポーネント
const HookTestComponent = () => {
  const { reportError, getStoredErrors, clearStoredErrors } = useErrorBoundary();

  return (
    <div>
      <button onClick={() => reportError(new Error('Hook test error'))}>
        Report Error
      </button>
      <button onClick={() => {
        const errors = getStoredErrors();
        console.log('Stored errors:', errors);
      }}>
        Get Errors
      </button>
      <button onClick={clearStoredErrors}>
        Clear Errors
      </button>
    </div>
  );
};

// localStorage のモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// navigator.clipboard のモック
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

// console.error のモック
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue('[]');
});

describe('ErrorBoundary', () => {
  describe('正常な動作', () => {
    it('エラーが発生しない場合は子コンポーネントを表示する', () => {
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('エラーが発生した場合はフォールバックUIを表示する', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('ページエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('このページの読み込み中にエラーが発生しました。')).toBeInTheDocument();
    });

    it('カスタムフォールバックが提供された場合はそれを表示する', () => {
      const customFallback = <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });
  });

  describe('エラーレベル別の表示', () => {
    it('pageレベルのエラーを正しく表示する', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('ページエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('再試行')).toBeInTheDocument();
      expect(screen.getByText('ホームに戻る')).toBeInTheDocument();
    });

    it('componentレベルのエラーを正しく表示する', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('コンポーネントエラー')).toBeInTheDocument();
      expect(screen.getByText('この機能の実行中にエラーが発生しました。')).toBeInTheDocument();
    });

    it('criticalレベルのエラーを正しく表示する', () => {
      render(
        <ErrorBoundary level="critical">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('重大なエラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('アプリケーションの実行を続行できません。')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('再試行ボタンをクリックするとエラー状態がリセットされる', () => {
      const { rerender } = render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('ページエラーが発生しました')).toBeInTheDocument();

      fireEvent.click(screen.getByText('再試行'));

      rerender(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('エラー報告ボタンをクリックするとエラーが報告される', async () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reportButton = screen.getByText('エラー報告');
      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(screen.getByText('報告済み')).toBeInTheDocument();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('詳細表示ボタンをクリックするとエラー詳細が表示される', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('詳細を表示'));

      expect(screen.getByText('エラー詳細')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('エラー詳細をコピーできる', async () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('詳細を表示'));
      fireEvent.click(screen.getByText('コピー'));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });

      expect(screen.getByText('コピー済み')).toBeInTheDocument();
    });
  });

  describe('カスタムエラーハンドラー', () => {
    it('onErrorコールバックが呼び出される', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('HOCでラップされたコンポーネントが正常に動作する', () => {
      render(<WrappedComponent />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('HOCでラップされたコンポーネントでエラーが発生した場合にフォールバックUIが表示される', () => {
      const ErrorComponent = withErrorBoundary(() => {
        throw new Error('HOC test error');
      }, { level: 'component' });

      render(<ErrorComponent />);
      expect(screen.getByText('コンポーネントエラー')).toBeInTheDocument();
    });
  });

  describe('useErrorBoundary フック', () => {
    it('reportError関数が正常に動作する', () => {
      render(<HookTestComponent />);

      fireEvent.click(screen.getByText('Report Error'));

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('getStoredErrors関数が正常に動作する', () => {
      const mockErrors = JSON.stringify([
        { id: 'test1', message: 'Test error 1' },
        { id: 'test2', message: 'Test error 2' }
      ]);
      mockLocalStorage.getItem.mockReturnValue(mockErrors);

      render(<HookTestComponent />);

      fireEvent.click(screen.getByText('Get Errors'));

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('app_errors');
    });

    it('clearStoredErrors関数が正常に動作する', () => {
      render(<HookTestComponent />);

      fireEvent.click(screen.getByText('Clear Errors'));

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app_errors');
    });

    it('getStoredErrorsでJSONパースエラーが発生した場合は空配列を返す', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const TestComponent = () => {
        const { getStoredErrors } = useErrorBoundary();
        const errors = getStoredErrors();
        return <div>Errors count: {errors.length}</div>;
      };

      render(<TestComponent />);

      expect(screen.getByText('Errors count: 0')).toBeInTheDocument();
    });
  });

  describe('エラーレポーター', () => {
    it('エラーIDが正しく生成される', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIdBadge = screen.getByText(/エラーID:/);
      expect(errorIdBadge).toBeInTheDocument();
      expect(errorIdBadge.textContent).toMatch(/エラーID: err_\d+_[a-z0-9]+/);
    });

    it('エラーがローカルストレージに保存される', async () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('エラー報告'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'app_errors',
          expect.any(String)
        );
      });
    });

    it('エラー保存時に最大10件の制限が適用される', async () => {
      // 既存のエラーを11件設定
      const existingErrors = Array.from({ length: 11 }, (_, i) => ({
        id: `err_${i}`,
        message: `Error ${i}`,
        timestamp: new Date().toISOString()
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingErrors));

      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('エラー報告'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });

      // setItemの呼び出し引数を確認
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const savedErrors = JSON.parse(setItemCall[1]);
      expect(savedErrors.length).toBe(10); // 最大10件に制限される
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorCard = screen.getByRole('alert', { hidden: true });
      expect(errorCard).toBeInTheDocument();
    });

    it('ボタンにアクセシブルなラベルが設定されている', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ホームに戻る/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /エラー報告/ })).toBeInTheDocument();
    });
  });
});
