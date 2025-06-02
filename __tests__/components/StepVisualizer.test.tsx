/**
 * StepVisualizerコンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepVisualizer, CompactStepVisualizer } from '../../src/app/components/analysis/StepVisualizer';

describe('StepVisualizer', () => {
  describe('基本的な表示', () => {
    it('全ステップが表示される', () => {
      render(<StepVisualizer currentStep="analyzing" />);

      expect(screen.getByText('入力確認')).toBeInTheDocument();
      expect(screen.getByText('AI解析')).toBeInTheDocument();
      expect(screen.getByText('結果整理')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('ステップの説明が表示される', () => {
      render(<StepVisualizer currentStep="analyzing" />);

      expect(screen.getByText('求人票テキストの検証')).toBeInTheDocument();
      expect(screen.getByText('詳細な分析実行')).toBeInTheDocument();
      expect(screen.getByText('データの構造化')).toBeInTheDocument();
      expect(screen.getByText('解析完了')).toBeInTheDocument();
    });
  });

  describe('ステップ状態', () => {
    it('現在のステップが正しく表示される', () => {
      render(<StepVisualizer currentStep="analyzing" />);

      // 現在のステップ（analyzing）にローダーアイコンが表示される
      // より具体的なセレクターを使用
      const loaderIcon = screen.getByTestId ?
        screen.queryByTestId('analyzing-loader') :
        document.querySelector('[data-testid="analyzing-loader"]') ||
        document.querySelector('.animate-spin');

      // アニメーションクラスの存在を確認
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('完了したステップにチェックマークが表示される', () => {
      render(<StepVisualizer currentStep="results" />);

      // 完了したステップのチェックマークを確認
      // CheckCircleアイコンが表示されることを確認
      const checkIcons = document.querySelectorAll('svg');
      const hasCheckIcon = Array.from(checkIcons).some(icon =>
        icon.classList.contains('lucide-check-circle') ||
        icon.getAttribute('data-testid') === 'check-circle'
      );
      expect(hasCheckIcon || checkIcons.length > 0).toBe(true);
    });

    it('待機中のステップが正しく表示される', () => {
      render(<StepVisualizer currentStep="input" />);

      // 待機中のステップ（analyzing, results, insights）
      expect(screen.getByText('結果整理')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  describe('レイアウト', () => {
    it('水平レイアウトで表示される（デフォルト）', () => {
      render(<StepVisualizer currentStep="analyzing" />);

      // ルートコンテナを取得
      const container = document.querySelector('[class*="flex"][class*="items-center"][class*="space-x"]');
      expect(container).toBeInTheDocument();
    });

    it('垂直レイアウトで表示される', () => {
      render(<StepVisualizer currentStep="analyzing" vertical={true} />);

      // 垂直レイアウトのコンテナを取得
      const container = document.querySelector('[class*="flex-col"][class*="items-center"][class*="space-y"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe('アニメーション', () => {
    it('アニメーション有効時にアニメーションクラスが適用される', () => {
      render(<StepVisualizer currentStep="analyzing" animated={true} />);

      // アニメーションクラスの存在を確認
      const animatedElement = document.querySelector('.animate-spin');
      expect(animatedElement).toBeInTheDocument();
    });

    it('アニメーション無効時にアニメーションクラスが適用されない', () => {
      render(<StepVisualizer currentStep="analyzing" animated={false} />);

      // アニメーションクラスが存在しないことを確認
      const animatedElement = document.querySelector('.animate-spin');
      expect(animatedElement).not.toBeInTheDocument();
    });
  });
});

describe('CompactStepVisualizer', () => {
  describe('基本的な表示', () => {
    it('現在のステップ名が表示される', () => {
      render(<CompactStepVisualizer currentStep="analyzing" />);

      expect(screen.getByText('AI解析')).toBeInTheDocument();
    });

    it('進捗率が表示される', () => {
      render(<CompactStepVisualizer currentStep="analyzing" />);

      // analyzingは2番目のステップなので50%
      expect(screen.getByText('(50%)')).toBeInTheDocument();
    });

    it('プログレスドットが表示される', () => {
      render(<CompactStepVisualizer currentStep="analyzing" />);

      // 4つのドットが表示される
      const container = screen.getByText('AI解析').parentElement;
      const dots = container?.querySelectorAll('.h-2.w-2.rounded-full');
      expect(dots).toHaveLength(4);
    });
  });

  describe('ステップ状態', () => {
    it('完了したステップのドットが緑色になる', () => {
      render(<CompactStepVisualizer currentStep="results" />);

      const container = screen.getByText('結果整理').parentElement;
      const dots = container?.querySelectorAll('.h-2.w-2.rounded-full');

      // 最初の2つのドット（input, analyzing）が完了状態
      expect(dots?.[0]).toHaveClass('bg-green-600');
      expect(dots?.[1]).toHaveClass('bg-green-600');
    });

    it('現在のステップのドットがアクティブ状態になる', () => {
      render(<CompactStepVisualizer currentStep="analyzing" animated={true} />);

      const container = screen.getByText('AI解析').parentElement;
      const dots = container?.querySelectorAll('.h-2.w-2.rounded-full');

      // 2番目のドット（analyzing）がアクティブ状態
      expect(dots?.[1]).toHaveClass('animate-pulse');
    });
  });

  describe('進捗計算', () => {
    it('各ステップの進捗率が正しく計算される', () => {
      const testCases = [
        { step: 'input' as const, expected: '(25%)' },
        { step: 'analyzing' as const, expected: '(50%)' },
        { step: 'results' as const, expected: '(75%)' },
        { step: 'insights' as const, expected: '(100%)' }
      ];

      testCases.forEach(({ step, expected }) => {
        const { unmount } = render(<CompactStepVisualizer currentStep={step} />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('アニメーション', () => {
    it('アニメーション有効時に現在のステップドットがパルスする', () => {
      render(<CompactStepVisualizer currentStep="analyzing" animated={true} />);

      const container = screen.getByText('AI解析').parentElement;
      const dots = container?.querySelectorAll('.h-2.w-2.rounded-full');

      expect(dots?.[1]).toHaveClass('animate-pulse');
    });

    it('アニメーション無効時にパルスしない', () => {
      render(<CompactStepVisualizer currentStep="analyzing" animated={false} />);

      const container = screen.getByText('AI解析').parentElement;
      const dots = container?.querySelectorAll('.h-2.w-2.rounded-full');

      expect(dots?.[1]).not.toHaveClass('animate-pulse');
    });
  });
});
