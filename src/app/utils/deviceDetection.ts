'use client';

import { useEffect, useState } from 'react';

/**
 * デバイス情報を検出するためのカスタムフック
 * ブラウザのビューポートサイズに基づいてデバイスタイプを判定
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceDetection(): {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // 初期化時に一度実行
    handleResize();
    
    // リサイズイベントをリッスン
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop'
  };
}
