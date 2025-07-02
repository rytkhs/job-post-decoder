/**
 * ErrorBoundaryコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  test('正常なコンポーネントは表示される', () => {
    render(
      <ErrorBoundary>
        <div>正常なコンテンツ</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('正常なコンテンツ')).toBeInTheDocument();
  });
});
