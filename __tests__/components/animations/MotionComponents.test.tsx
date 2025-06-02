/**
 * MotionComponentsのテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  FadeIn,
  SlideIn,
  ScaleIn,
  BounceIn,
  StaggeredList,
  StaggeredItem,
  HoverScale,
  AnimatedPresenceWrapper,
  PageTransition,
  Pulse,
  Shake
} from '../../../src/app/components/animations/MotionComponents';

// Framer Motionのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} data-testid="motion-span" {...props}>
        {children}
      </span>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('MotionComponents', () => {
  describe('FadeIn', () => {
    test('子要素が正しく表示される', () => {
      render(
        <FadeIn>
          <div>テストコンテンツ</div>
        </FadeIn>
      );

      expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    test('カスタムクラス名が適用される', () => {
      render(
        <FadeIn className="custom-class">
          <div>テストコンテンツ</div>
        </FadeIn>
      );

      expect(screen.getByTestId('motion-div')).toHaveClass('custom-class');
    });
  });

  describe('SlideIn', () => {
    test('デフォルトで左からのスライドイン', () => {
      render(
        <SlideIn>
          <div>スライドコンテンツ</div>
        </SlideIn>
      );

      expect(screen.getByText('スライドコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    test('方向を指定できる', () => {
      render(
        <SlideIn direction="right">
          <div>右からスライド</div>
        </SlideIn>
      );

      expect(screen.getByText('右からスライド')).toBeInTheDocument();
    });

    test('上下方向のスライドも可能', () => {
      const { rerender } = render(
        <SlideIn direction="up">
          <div>上からスライド</div>
        </SlideIn>
      );

      expect(screen.getByText('上からスライド')).toBeInTheDocument();

      rerender(
        <SlideIn direction="down">
          <div>下からスライド</div>
        </SlideIn>
      );

      expect(screen.getByText('下からスライド')).toBeInTheDocument();
    });
  });

  describe('ScaleIn', () => {
    test('スケールアニメーションが適用される', () => {
      render(
        <ScaleIn>
          <div>スケールコンテンツ</div>
        </ScaleIn>
      );

      expect(screen.getByText('スケールコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  describe('BounceIn', () => {
    test('バウンスアニメーションが適用される', () => {
      render(
        <BounceIn>
          <div>バウンスコンテンツ</div>
        </BounceIn>
      );

      expect(screen.getByText('バウンスコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  describe('StaggeredList', () => {
    test('ステージャードリストが正しく表示される', () => {
      render(
        <StaggeredList>
          <StaggeredItem>
            <div>アイテム1</div>
          </StaggeredItem>
          <StaggeredItem>
            <div>アイテム2</div>
          </StaggeredItem>
        </StaggeredList>
      );

      expect(screen.getByText('アイテム1')).toBeInTheDocument();
      expect(screen.getByText('アイテム2')).toBeInTheDocument();
      expect(screen.getAllByTestId('motion-div')).toHaveLength(3); // コンテナ + 2アイテム
    });
  });

  describe('HoverScale', () => {
    test('ホバースケールが適用される', () => {
      render(
        <HoverScale>
          <div>ホバーコンテンツ</div>
        </HoverScale>
      );

      expect(screen.getByText('ホバーコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    test('カスタムスケール値を設定できる', () => {
      render(
        <HoverScale scale={1.2}>
          <div>カスタムスケール</div>
        </HoverScale>
      );

      expect(screen.getByText('カスタムスケール')).toBeInTheDocument();
    });
  });

  describe('AnimatedPresenceWrapper', () => {
    test('AnimatePresenceでラップされる', () => {
      render(
        <AnimatedPresenceWrapper>
          <div>プレゼンスコンテンツ</div>
        </AnimatedPresenceWrapper>
      );

      expect(screen.getByText('プレゼンスコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
    });
  });

  describe('PageTransition', () => {
    test('ページトランジションが適用される', () => {
      render(
        <PageTransition>
          <div>ページコンテンツ</div>
        </PageTransition>
      );

      expect(screen.getByText('ページコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  describe('Pulse', () => {
    test('パルスアニメーションが適用される', () => {
      render(
        <Pulse>
          <div>パルスコンテンツ</div>
        </Pulse>
      );

      expect(screen.getByText('パルスコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  describe('Shake', () => {
    test('シェイクアニメーションが適用される', () => {
      render(
        <Shake trigger={true}>
          <div>シェイクコンテンツ</div>
        </Shake>
      );

      expect(screen.getByText('シェイクコンテンツ')).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });

    test('トリガーがfalseの場合はアニメーションしない', () => {
      render(
        <Shake trigger={false}>
          <div>静的コンテンツ</div>
        </Shake>
      );

      expect(screen.getByText('静的コンテンツ')).toBeInTheDocument();
    });
  });

  describe('アニメーション設定', () => {
    test('遅延とデュレーションを設定できる', () => {
      render(
        <FadeIn delay={0.5} duration={1}>
          <div>遅延コンテンツ</div>
        </FadeIn>
      );

      expect(screen.getByText('遅延コンテンツ')).toBeInTheDocument();
    });

    test('ステージャード遅延を設定できる', () => {
      render(
        <StaggeredList staggerDelay={0.2}>
          <StaggeredItem>
            <div>遅延アイテム</div>
          </StaggeredItem>
        </StaggeredList>
      );

      expect(screen.getByText('遅延アイテム')).toBeInTheDocument();
    });
  });
});
