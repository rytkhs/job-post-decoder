/**
 * Framer Motionを使用した再利用可能なアニメーションコンポーネント
 * 一貫したアニメーション体験を提供
 */
'use client';

import React from 'react';
import { motion, AnimatePresence, Variants, useInView } from 'framer-motion';

/**
 * 基本的なアニメーション設定
 */
export const animationConfig = {
  // 基本的なイージング
  easing: [0.25, 0.1, 0.25, 1],

  // デュレーション設定
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    verySlow: 0.8
  },

  // スプリング設定
  spring: {
    type: 'spring',
    damping: 25,
    stiffness: 300
  },

  // バウンス設定
  bounce: {
    type: 'spring',
    damping: 10,
    stiffness: 100
  }
};

/**
 * フェードインアニメーション
 */
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easing
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * スライドインアニメーション（左から）
 */
export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -50
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easing
    }
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * スライドインアニメーション（右から）
 */
export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easing
    }
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * スケールアニメーション
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easing
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * バウンスアニメーション
 */
export const bounceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: animationConfig.bounce
  },
  exit: {
    opacity: 0,
    scale: 0.3,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * ステージャードアニメーション（子要素を順次表示）
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animationConfig.duration.normal,
      ease: animationConfig.easing
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: animationConfig.duration.fast,
      ease: animationConfig.easing
    }
  }
};

/**
 * フェードインコンポーネント
 */
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = animationConfig.duration.normal, className }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
      transition={{
        duration,
        delay,
        ease: animationConfig.easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * スライドインコンポーネント
 */
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = animationConfig.duration.normal,
  className
}: SlideInProps) {
  const getVariants = () => {
    switch (direction) {
      case 'right':
        return slideInRightVariants;
      case 'up':
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 50 }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -50 }
        };
      default:
        return slideInLeftVariants;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={getVariants()}
      transition={{
        duration,
        delay,
        ease: animationConfig.easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * スケールアニメーションコンポーネント
 */
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, duration = animationConfig.duration.normal, className }: ScaleInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={scaleVariants}
      transition={{
        duration,
        delay,
        ease: animationConfig.easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * バウンスアニメーションコンポーネント
 */
interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function BounceIn({ children, delay = 0, className }: BounceInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={bounceVariants}
      transition={{
        ...animationConfig.bounce,
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ステージャードアニメーションコンポーネント
 */
interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 0.1 }: StaggeredListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={staggerContainerVariants}
      transition={{
        staggerChildren: staggerDelay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ホバーアニメーションコンポーネント
 */
interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.05, className }: HoverScaleProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: scale * 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * プレゼンスアニメーションラッパー
 */
interface AnimatedPresenceWrapperProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function AnimatedPresenceWrapper({ children, mode = 'wait' }: AnimatedPresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

/**
 * ページトランジションコンポーネント
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: animationConfig.duration.normal,
        ease: animationConfig.easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * カードフリップアニメーション
 */
interface FlipCardProps {
  children: React.ReactNode;
  isFlipped: boolean;
  className?: string;
}

export function FlipCard({ children, isFlipped, className }: FlipCardProps) {
  return (
    <motion.div
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{
        duration: animationConfig.duration.slow,
        ease: animationConfig.easing
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * プログレスバーアニメーション
 */
interface AnimatedProgressProps {
  value: number;
  className?: string;
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{
        duration: animationConfig.duration.slow,
        ease: animationConfig.easing
      }}
      className={className}
    />
  );
}

/**
 * カウンターアニメーション
 */
interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ from, to, className }: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <motion.span
        initial={{ y: from }}
        animate={{ y: to }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 200
        }}
        onUpdate={() => {
          // カウンターの値を更新（実装は使用側で行う）
        }}
      >
        {to}
      </motion.span>
    </motion.span>
  );
}

/**
 * パルスアニメーション
 */
interface PulseProps {
  children: React.ReactNode;
  className?: string;
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * シェイクアニメーション（エラー時など）
 */
interface ShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  className?: string;
}

export function Shake({ children, trigger, className }: ShakeProps) {
  return (
    <motion.div
      animate={trigger ? {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * スクロール連動アニメーション
 */
export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}
