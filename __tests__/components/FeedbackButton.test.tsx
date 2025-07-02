/**
 * FeedbackButtonコンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackButton } from '../../src/app/components/shared/FeedbackButton';

describe('FeedbackButton', () => {
  const mockOnFeedback = jest.fn();
  const defaultProps = {
    findingId: 'test-finding-1',
    onFeedback: mockOnFeedback,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的な表示', () => {
    it('👍と👎ボタンが表示される', () => {
      render(<FeedbackButton {...defaultProps} />);

      expect(screen.getByTitle('役に立った')).toBeInTheDocument();
      expect(screen.getByTitle('役に立たなかった')).toBeInTheDocument();
    });

    it('👍ボタンクリックで helpful フィードバックが送信される', () => {
      render(<FeedbackButton {...defaultProps} />);

      const helpfulButton = screen.getByTitle('役に立った');
      fireEvent.click(helpfulButton);

      expect(mockOnFeedback).toHaveBeenCalledWith('test-finding-1', 'helpful');
    });
  });
});
