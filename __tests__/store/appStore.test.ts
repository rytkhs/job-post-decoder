/**
 * appStoreのテスト
 */

import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../src/app/store/appStore';

describe('useAppStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetState();
    });
  });

  describe('基本動作', () => {
    test('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.enableAnimations).toBe(true);
      expect(result.current.isDarkMode).toBe(false);
      expect(result.current.analysisHistory).toHaveLength(0);
    });

    test('アニメーション設定を切り替えできる', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.enableAnimations).toBe(false);
    });
  });
});
