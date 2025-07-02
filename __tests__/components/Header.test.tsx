/**
 * Headerコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/app/components/Header';

describe('Header コンポーネント', () => {
  test('ヘッダーが表示される', () => {
    render(<Header />);

    expect(screen.getAllByText('ブラック求人チェッカー')[0]).toBeInTheDocument();
  });
});
