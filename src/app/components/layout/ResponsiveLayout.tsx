/**
 * レスポンシブレイアウトコンポーネント
 * モバイル最適化とデスクトップ体験向上を含みます。
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

/**
 * ブレークポイント定義
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * デバイスタイプ
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * レイアウトモード
 */
export type LayoutMode = 'single' | 'sidebar' | 'split' | 'fullscreen';

/**
 * カスタムフック：デバイス検出
 */
export function useDeviceDetection() {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({ width, height });
      setOrientation(height > width ? 'portrait' : 'landscape');

      if (width < breakpoints.md) {
        setDeviceType('mobile');
      } else if (width < breakpoints.lg) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return { deviceType, screenSize, orientation };
}

/**
 * カスタムフック：タッチジェスチャー
 */
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isUpSwipe = distanceY > 50;
    const isDownSwipe = distanceY < -50;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY
    };
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  };
}

/**
 * レスポンシブコンテナコンポーネント
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  return (
    <div className={`
      mx-auto w-full
      ${maxWidthClasses[maxWidth]}
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * モバイル最適化ナビゲーション
 */
interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function MobileNavigation({ isOpen, onToggle, children }: MobileNavigationProps) {
  const { deviceType } = useDeviceDetection();

  if (deviceType !== 'mobile') return null;

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 md:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* モバイルメニュー */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* メニューコンテンツ */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-80 bg-background border-r z-50 md:hidden overflow-y-auto"
            >
              <div className="pt-16 p-4">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * デスクトップサイドバー
 */
interface DesktopSidebarProps {
  children: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  width?: 'sm' | 'md' | 'lg';
}

export function DesktopSidebar({
  children,
  isCollapsed,
  onToggle,
  width = 'md'
}: DesktopSidebarProps) {
  const { deviceType } = useDeviceDetection();

  if (deviceType === 'mobile') return null;

  const widthClasses = {
    sm: isCollapsed ? 'w-16' : 'w-64',
    md: isCollapsed ? 'w-16' : 'w-80',
    lg: isCollapsed ? 'w-16' : 'w-96'
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : (width === 'sm' ? 256 : width === 'md' ? 320 : 384) }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        hidden md:flex flex-col
        ${widthClasses[width]}
        border-r bg-background/50 backdrop-blur-sm
        transition-all duration-300
      `}
    >
      {/* 折りたたみボタン */}
      <div className="flex justify-end p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* サイドバーコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * アダプティブグリッド
 */
interface AdaptiveGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: number;
  gap?: 'sm' | 'md' | 'lg';
}

export function AdaptiveGrid({
  children,
  className = '',
  minItemWidth = 300,
  gap = 'md'
}: AdaptiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div
      className={`
        grid
        ${gapClasses[gap]}
        ${className}
      `}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`
      }}
    >
      {children}
    </div>
  );
}

/**
 * スワイプ可能なカードコンテナ
 */
interface SwipeableCardContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeableCardContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: SwipeableCardContainerProps) {
  const { deviceType } = useDeviceDetection();
  const touchGestures = useTouchGestures();

  const handleTouchEnd = () => {
    const gesture = touchGestures.onTouchEnd();
    if (!gesture) return;

    if (gesture.isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (gesture.isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  if (deviceType === 'desktop') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`touch-pan-y ${className}`}
      onTouchStart={touchGestures.onTouchStart}
      onTouchMove={touchGestures.onTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

/**
 * レスポンシブテキスト
 */
interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export function ResponsiveText({
  children,
  size = 'base',
  className = ''
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl'
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

/**
 * デバイス表示制御コンポーネント
 */
interface ShowOnDeviceProps {
  children: React.ReactNode;
  device: DeviceType | DeviceType[];
}

export function ShowOnDevice({ children, device }: ShowOnDeviceProps) {
  const { deviceType } = useDeviceDetection();
  const targetDevices = Array.isArray(device) ? device : [device];

  if (!targetDevices.includes(deviceType)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * フルスクリーンモード
 */
interface FullscreenModeProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  onToggle: () => void;
}

export function FullscreenMode({
  children,
  isFullscreen,
  onToggle
}: FullscreenModeProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, onToggle]);

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}>
      {/* フルスクリーン切り替えボタン */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute top-4 right-4 z-10"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>

      <div className={isFullscreen ? 'h-full overflow-y-auto p-8' : ''}>
        {children}
      </div>
    </div>
  );
}

/**
 * デバイス情報表示（開発用）
 */
export function DeviceInfo() {
  const { deviceType, screenSize, orientation } = useDeviceDetection();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 p-2 text-xs bg-background/80 backdrop-blur-sm z-50">
      <div className="flex items-center gap-2">
        {getDeviceIcon()}
        <span>{deviceType}</span>
        <span>|</span>
        <span>{screenSize.width}×{screenSize.height}</span>
        <span>|</span>
        <span>{orientation}</span>
      </div>
    </Card>
  );
}

/**
 * メインレスポンシブレイアウト
 */
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  layoutMode?: LayoutMode;
}

export function ResponsiveLayout({
  children,
  sidebar,
  header,
  footer,
  layoutMode = 'single'
}: ResponsiveLayoutProps) {
  const { deviceType } = useDeviceDetection();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isCompactView = useAppStore(state => state.isCompactView);

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      {header && !isFullscreen && (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
          {header}
        </header>
      )}

      <div className="flex">
        {/* サイドバー（デスクトップ） */}
        {sidebar && layoutMode !== 'single' && (
          <DesktopSidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {sidebar}
          </DesktopSidebar>
        )}

        {/* モバイルナビゲーション */}
        {sidebar && deviceType === 'mobile' && (
          <MobileNavigation
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {sidebar}
          </MobileNavigation>
        )}

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">
          <FullscreenMode
            isFullscreen={isFullscreen}
            onToggle={() => setIsFullscreen(!isFullscreen)}
          >
            <ResponsiveContainer
              maxWidth={layoutMode === 'fullscreen' ? 'full' : '2xl'}
              padding={isCompactView ? 'sm' : 'md'}
            >
              {children}
            </ResponsiveContainer>
          </FullscreenMode>
        </main>
      </div>

      {/* フッター */}
      {footer && !isFullscreen && (
        <footer className="border-t bg-background/50">
          {footer}
        </footer>
      )}

      {/* 開発用デバイス情報 */}
      <DeviceInfo />
    </div>
  );
}
