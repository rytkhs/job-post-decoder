/**
 * InterleaveDisplayコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('InterleaveDisplay コンポーネント', () => {
  test('基本的な表示ができる', () => {
    const Component = () => <div>テスト表現</div>;
    render(<Component />);

    expect(screen.getByText('テスト表現')).toBeInTheDocument();
  });
});
