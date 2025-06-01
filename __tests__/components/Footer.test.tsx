import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../src/app/components/Footer';

describe('Footer コンポーネント', () => {
  test('フッターが正しくレンダリングされること', () => {
    render(<Footer />);
    
    // 著作権表示が表示されること
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} 求人票デコーダー`, 'i'))).toBeInTheDocument();
    
    // サービス目的の表示が確認できること
    expect(screen.getByText(/作成/i)).toBeInTheDocument();
    expect(screen.getByText(/で求職者を応援/i)).toBeInTheDocument();
    
    // 免責事項が表示されること
    expect(screen.getByText(/免責事項:/i)).toBeInTheDocument();
    expect(screen.getByText(/本サービスの解析結果はAIによるものであり/i)).toBeInTheDocument();
  });
});
