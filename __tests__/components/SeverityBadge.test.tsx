/**
 * SeverityBadgeコンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SeverityBadge, getSeverityTextColor, getSeverityBackgroundColor, getSeverityOrder } from '../../src/app/components/results/SeverityBadge';

describe('SeverityBadge', () => {
  describe('基本的な表示', () => {
    it('高重要度のバッジが正しく表示される', () => {
      render(<SeverityBadge severity="high" />);

      expect(screen.getByText('要注意')).toBeInTheDocument();
      expect(screen.getByTitle('高い注意が必要')).toBeInTheDocument();
    });

    it('中重要度のバッジが正しく表示される', () => {
      render(<SeverityBadge severity="medium" />);

      expect(screen.getByText('注意')).toBeInTheDocument();
      expect(screen.getByTitle('中程度の注意が必要')).toBeInTheDocument();
    });

    it('低重要度のバッジが正しく表示される', () => {
      render(<SeverityBadge severity="low" />);

      expect(screen.getByText('軽微')).toBeInTheDocument();
      expect(screen.getByTitle('軽微な注意点')).toBeInTheDocument();
    });
  });

  describe('サイズ設定', () => {
    it('小サイズのバッジが正しく表示される', () => {
      render(<SeverityBadge severity="high" size="sm" />);

      const badge = screen.getByText('要注意').closest('div');
      expect(badge).toHaveClass('text-xs');
    });

    it('大サイズのバッジが正しく表示される', () => {
      render(<SeverityBadge severity="high" size="lg" />);

      const badge = screen.getByText('要注意').closest('div');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('アイコン表示', () => {
    it('アイコンありで表示される', () => {
      render(<SeverityBadge severity="high" showIcon={true} />);

      const badge = screen.getByText('要注意').closest('div');
      expect(badge?.querySelector('svg')).toBeInTheDocument();
    });

    it('アイコンなしで表示される', () => {
      render(<SeverityBadge severity="high" showIcon={false} />);

      const badge = screen.getByText('要注意').closest('div');
      expect(badge?.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('カスタムクラス', () => {
    it('カスタムクラスが適用される', () => {
      render(<SeverityBadge severity="high" className="custom-class" />);

      const badge = screen.getByText('要注意').closest('div');
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('ユーティリティ関数', () => {
  describe('getSeverityTextColor', () => {
    it('各重要度に対して正しい色クラスを返す', () => {
      expect(getSeverityTextColor('high')).toBe('text-red-600 dark:text-red-400');
      expect(getSeverityTextColor('medium')).toBe('text-yellow-600 dark:text-yellow-400');
      expect(getSeverityTextColor('low')).toBe('text-blue-600 dark:text-blue-400');
    });
  });

  describe('getSeverityBackgroundColor', () => {
    it('各重要度に対して正しい背景色クラスを返す', () => {
      expect(getSeverityBackgroundColor('high')).toBe('bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800');
      expect(getSeverityBackgroundColor('medium')).toBe('bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800');
      expect(getSeverityBackgroundColor('low')).toBe('bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800');
    });
  });

  describe('getSeverityOrder', () => {
    it('各重要度に対して正しい順序を返す', () => {
      expect(getSeverityOrder('high')).toBe(3);
      expect(getSeverityOrder('medium')).toBe(2);
      expect(getSeverityOrder('low')).toBe(1);
    });

    it('重要度順でソートできる', () => {
      const severities = ['low', 'high', 'medium'] as const;
      const sorted = [...severities].sort((a, b) => getSeverityOrder(b) - getSeverityOrder(a));

      expect(sorted).toEqual(['high', 'medium', 'low']);
    });
  });
});
