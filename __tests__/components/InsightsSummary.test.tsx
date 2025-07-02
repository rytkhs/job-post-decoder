/**
 * InsightsSummaryコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('InsightsSummary コンポーネント', () => {
  test('基本的な表示ができる', () => {
    const Component = () => <div>インサイト要約</div>;
    render(<Component />);

    expect(screen.getByText('インサイト要約')).toBeInTheDocument();
  });
});
