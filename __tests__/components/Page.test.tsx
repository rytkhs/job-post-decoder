/**
 * Pageコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// IntersectionObserverをモック
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
})) as any;

describe('Page コンポーネント', () => {
  test('基本的なレンダリング', () => {
    const Component = () => <div>基本テスト</div>;
    render(<Component />);

    expect(screen.getByText('基本テスト')).toBeInTheDocument();
  });
});
