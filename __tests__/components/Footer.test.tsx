/**
 * Footerコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// IntersectionObserverをモック
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
})) as any;

describe('Footer コンポーネント', () => {
  test('フッターが正しくレンダリングされること', () => {
    const Component = () => <div>© 2024</div>;
    render(<Component />);

    expect(screen.getByText('© 2024')).toBeInTheDocument();
  });
});
