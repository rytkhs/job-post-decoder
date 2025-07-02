/**
 * DecodingResult コンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DecodingResult } from '../../src/app/components/DecodingResult';

describe('DecodingResult コンポーネント', () => {
  test('ローディング状態が正しく表示されること', () => {
    render(<DecodingResult result={null} isLoading={true} error={null} />);

    expect(screen.getByText(/解析/i)).toBeInTheDocument();
  });

  test('エラー状態が正しく表示されること', () => {
    const errorMessage = 'テストエラーメッセージ';
    render(<DecodingResult result={null} isLoading={false} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('結果がない場合のメッセージが表示されること', () => {
    render(<DecodingResult result={{ findings: [] }} isLoading={false} error={null} />);

    expect(screen.getByText(/見つかりませんでした/i)).toBeInTheDocument();
  });
});
