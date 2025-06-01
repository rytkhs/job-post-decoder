import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobPostingForm } from '../../src/app/components/JobPostingForm';

// モック関数
const mockOnSubmit = jest.fn();

describe('JobPostingForm コンポーネント', () => {
  // 各テスト前にモック関数をリセット
  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('コンポーネントが正しくレンダリングされること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    // テキストエリアが存在するか確認
    expect(screen.getByLabelText(/求人票のテキストを入力してください/i)).toBeInTheDocument();
    
    // ボタンが存在するか確認
    expect(screen.getByText(/例文を挿入/i)).toBeInTheDocument();
    expect(screen.getByText(/クリア/i)).toBeInTheDocument();
    expect(screen.getByText(/デコード開始/i)).toBeInTheDocument();
  });

  test('テキストエリアに入力できること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票' } });
    
    expect(textarea).toHaveValue('テスト求人票');
  });

  test('クリアボタンでテキストがクリアされること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票' } });
    
    const clearButton = screen.getByText(/クリア/i);
    fireEvent.click(clearButton);
    
    expect(textarea).toHaveValue('');
  });

  test('例文を挿入ボタンでテキストエリアに例文が挿入されること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const exampleButton = screen.getByText(/例文を挿入/i);
    fireEvent.click(exampleButton);
    
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    expect(textarea).not.toHaveValue('');
    expect(textarea.value).toContain('【募集職種】');
  });

  test('フォーム送信時にonSubmitが呼ばれること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const textarea = screen.getByLabelText(/求人票のテキストを入力してください/i);
    fireEvent.change(textarea, { target: { value: 'テスト求人票' } });
    
    const submitButton = screen.getByText(/デコード開始/i);
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('テスト求人票');
  });

  test('テキストが空の場合はフォーム送信されないこと', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={false} />);
    
    const submitButton = screen.getByText(/デコード開始/i);
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('ローディング中は各要素が無効化されること', () => {
    render(<JobPostingForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    // テキストエリアが無効化されているか確認
    expect(screen.getByLabelText(/求人票のテキストを入力してください/i)).toBeDisabled();
    
    // ボタンが無効化されているか確認
    expect(screen.getByText(/例文を挿入/i)).toBeDisabled();
    expect(screen.getByText(/デコード中/i)).toBeInTheDocument();
  });
});
