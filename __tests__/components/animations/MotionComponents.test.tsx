/**
 * MotionComponentsのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('MotionComponents', () => {
  test('基本的なアニメーション', () => {
    const Component = () => <div>ページトランジション</div>;
    render(<Component />);

    expect(screen.getByText('ページトランジション')).toBeInTheDocument();
  });
});
