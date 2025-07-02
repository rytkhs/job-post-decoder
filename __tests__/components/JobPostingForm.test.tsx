/**
 * JobPostingFormコンポーネントのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { JobPostingForm } from '../../src/app/components/JobPostingForm';

const mockOnSubmit = jest.fn();

describe('JobPostingForm コンポーネント', () => {
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('コンポーネントが正しくレンダリングされること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);

    expect(screen.getByText('求人票を解析')).toBeInTheDocument();
  });
});
