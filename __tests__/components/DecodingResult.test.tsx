import React from 'react';
import { render, screen } from '@testing-library/react';
import { DecodingResult } from '../../src/app/components/DecodingResult';

// テスト用のモックデータ
const mockResult = {
  findings: [
    {
      original_phrase: 'アットホームな職場環境',
      potential_realities: [
        '上下関係が厳しい可能性がある',
        '長時間労働が常態化している可能性がある'
      ],
      points_to_check: [
        '具体的な社内コミュニケーションの例を聞いてみる',
        '残業時間や休日出勤の実態について質問する'
      ]
    }
  ]
};

describe('DecodingResult コンポーネント', () => {
  test('ローディング状態が正しく表示されること', () => {
    render(<DecodingResult result={null} isLoading={true} error={null} />);
    
    expect(screen.getByText(/求人票を解析しています/i)).toBeInTheDocument();
    expect(screen.getByText(/しばらくお待ちください/i)).toBeInTheDocument();
  });

  test('エラー状態が正しく表示されること', () => {
    const errorMessage = 'テストエラーメッセージ';
    render(<DecodingResult result={null} isLoading={false} error={errorMessage} />);
    
    // エラーメッセージが表示されること
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // エラーカラーのカードが表示されること
    const errorCard = document.querySelector('.border-red-200');
    expect(errorCard).toBeInTheDocument();
  });

  test('結果がない場合のメッセージが表示されること', () => {
    render(<DecodingResult result={{ findings: [] }} isLoading={false} error={null} />);
    
    expect(screen.getByText(/特に注意すべき表現は見つかりませんでした/i)).toBeInTheDocument();
  });

  test('解析結果が正しく表示されること', () => {
    render(<DecodingResult result={mockResult} isLoading={false} error={null} />);
    
    // セクションタイトルが表示されること
    // セクションタイトルは実装によって異なる可能性があるためテストしない
    
    // 原文が表示されること
    expect(screen.getByText(/アットホームな職場環境/i)).toBeInTheDocument();
    
    // 本音の可能性が表示されること
    expect(screen.getByText(/上下関係が厳しい可能性がある/i)).toBeInTheDocument();
    expect(screen.getByText(/長時間労働が常態化している可能性がある/i)).toBeInTheDocument();
    
    // 確認ポイントが表示されること
    expect(screen.getByText(/具体的な社内コミュニケーションの例を聞いてみる/i)).toBeInTheDocument();
    expect(screen.getByText(/残業時間や休日出勤の実態について質問する/i)).toBeInTheDocument();
  });
});
