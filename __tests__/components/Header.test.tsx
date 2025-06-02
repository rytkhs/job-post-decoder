import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/app/components/Header';

describe('Header コンポーネント', () => {
  test('ヘッダーが正しくレンダリングされること', () => {
    render(<Header />);
    
    // アプリケーション名が表示されること
    expect(screen.getByText(/求人票デコーダー/i)).toBeInTheDocument();
    
    // 説明文が表示されること
    expect(screen.getByText(/求人票の裏にある本音をAIが解析します/i)).toBeInTheDocument();
  });
});
