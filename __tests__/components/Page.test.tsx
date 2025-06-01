import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../../src/app/page';
import '@testing-library/jest-dom';

// fetchのモック
global.fetch = jest.fn();

// console.errorのモック
const originalConsoleError = console.error;
console.error = jest.fn();

// 各テスト後にモックをリセット
afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
  (console.error as jest.Mock).mockClear();
});

// 全テスト完了後にconsole.errorを元に戻す
afterAll(() => {
  console.error = originalConsoleError;
});

describe('Home ページコンポーネント', () => {
  // 各テスト前にfetchモックをリセット
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('ページが正しくレンダリングされること', () => {
    render(<Home />);
    
    // ページタイトルが表示されること
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/求人票のテキストを入力/i);
    
    // フォームが表示されること
    expect(screen.getByLabelText(/求人票のテキストを入力してください/i)).toBeInTheDocument();
    
    // フッターはページコンポーネントに含まれていないためテストしない
  });

  test('フォーム送信時にAPIが呼び出されること', async () => {
    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        findings: [
          {
            original_phrase: 'アットホームな職場環境',
            potential_realities: ['上下関係が厳しい可能性がある'],
            points_to_check: ['具体的な社内コミュニケーションの例を聞いてみる']
          }
        ]
      })
    });

    render(<Home />);
    
    // テキストエリアに入力
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票のテキスト。十分な長さがあります。' } });
    
    // フォーム送信
    const submitButton = screen.getByText(/デコード開始/i);
    fireEvent.click(submitButton);
    
    // APIが呼び出されたことを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/decode-job-posting', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ text: 'テスト求人票のテキスト。十分な長さがあります。' })
      }));
    });
    
    // ローディング状態が表示されることを確認
    expect(screen.getByText(/求人票を解析しています/i)).toBeInTheDocument();
    expect(screen.getByText(/しばらくお待ちください/i)).toBeInTheDocument();
    
    // 結果が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/解析結果/i)).toBeInTheDocument();
      expect(screen.getByText(/アットホームな職場環境/i)).toBeInTheDocument();
    });
  });

  test('API呼び出しでエラーが発生した場合、エラーメッセージが表示されること', async () => {
    // fetchのモック実装（エラーケース）
    const errorMessage = 'テストエラーメッセージ';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage })
    });

    render(<Home />);
    
    // テキストエリアに入力
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票のテキスト。十分な長さがあります。' } });
    
    // フォーム送信
    const submitButton = screen.getByText(/デコード開始/i);
    fireEvent.click(submitButton);
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      // AlertCircleアイコンの隣にエラーメッセージが表示される
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      // エラーカードのクラスを確認
      const errorCard = screen.getByText(errorMessage).closest('.border-red-200');
      expect(errorCard).toBeInTheDocument();
    });
  });

  test('ネットワークエラーが発生した場合、適切なエラーメッセージが表示されること', async () => {
    // fetchのモック実装（ネットワークエラー）
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    render(<Home />);
    
    // テキストエリアに入力
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票のテキスト。十分な長さがあります。' } });
    
    // フォーム送信
    const submitButton = screen.getByText(/デコード開始/i);
    fireEvent.click(submitButton);
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      // Network Errorメッセージが表示される
      expect(screen.getByText('Network Error')).toBeInTheDocument();
      // エラーカードのクラスを確認
      const errorCard = screen.getByText('Network Error').closest('.border-red-200');
      expect(errorCard).toBeInTheDocument();
    });
  });
});
