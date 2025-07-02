/**
 * SettingsPanelのテスト
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SettingsPanel } from '../../../src/app/components/settings/SettingsPanel';
import { useAppStore } from '../../../src/app/store/appStore';

// Framer Motionのモック
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

// useDeviceDetectionのモック
jest.mock('../../../src/app/components/layout/ResponsiveLayout', () => ({
  useDeviceDetection: () => ({
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Zustandストアのモック
jest.mock('../../../src/app/store/appStore');

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>;

describe('SettingsPanel', () => {
  const mockOnClose = jest.fn();

  const defaultStoreState = {
    enableAnimations: true,
    showAdvancedProgress: false,
    isDarkMode: false,
    isCompactView: false,
    analysisHistory: [],
    feedbackHistory: {},
    customQuestions: [],
    toggleAnimations: jest.fn(),
    toggleAdvancedProgress: jest.fn(),
    toggleDarkMode: jest.fn(),
    toggleCompactView: jest.fn(),
    clearHistory: jest.fn(),
    clearFeedback: jest.fn(),
    resetState: jest.fn(),
    exportState: jest.fn(() => '{}'),
    importState: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppStore.mockReturnValue(defaultStoreState as any);
  });

  describe('表示制御', () => {
    test('isOpenがfalseの場合は表示されない', () => {
      render(<SettingsPanel isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('設定')).not.toBeInTheDocument();
    });

    test('isOpenがtrueの場合は表示される', () => {
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('設定')).toBeInTheDocument();
    });

    test('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('タブ切り替え', () => {
    test('デフォルトで外観タブが選択されている', () => {
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('テーマ')).toBeInTheDocument();
    });

    test('動作タブに切り替えできる', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const behaviorTab = screen.getByRole('tab', { name: /動作/i });
      await user.click(behaviorTab);

      expect(screen.getByText('アニメーション')).toBeInTheDocument();
    });

    test('データタブに切り替えできる', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      expect(screen.getByText('ストレージ使用量')).toBeInTheDocument();
    });
  });

  describe('外観設定', () => {
    test('ライトテーマボタンが表示される', () => {
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('ライト')).toBeInTheDocument();
      expect(screen.getByText('ダーク')).toBeInTheDocument();
    });

    test('ダークモード切り替えが動作する', async () => {
      const user = userEvent.setup();
      const toggleDarkMode = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        toggleDarkMode
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const darkButton = screen.getByText('ダーク');
      await user.click(darkButton);

      expect(toggleDarkMode).toHaveBeenCalledTimes(1);
    });

    test('コンパクト表示の切り替えが動作する', async () => {
      const user = userEvent.setup();
      const toggleCompactView = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        toggleCompactView
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const compactSwitch = screen.getByRole('switch');
      await user.click(compactSwitch);

      expect(toggleCompactView).toHaveBeenCalledTimes(1);
    });
  });

  describe('動作設定', () => {
    test('アニメーション設定が表示される', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const behaviorTab = screen.getByRole('tab', { name: /動作/i });
      await user.click(behaviorTab);

      expect(screen.getByText('アニメーション')).toBeInTheDocument();
    });

    test('アニメーション切り替えが動作する', async () => {
      const user = userEvent.setup();
      const toggleAnimations = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        toggleAnimations
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const behaviorTab = screen.getByRole('tab', { name: /動作/i });
      await user.click(behaviorTab);

      const animationSwitch = screen.getAllByRole('switch')[0];
      await user.click(animationSwitch);

      expect(toggleAnimations).toHaveBeenCalledTimes(1);
    });
  });

  describe('データ管理', () => {
    test('ストレージ使用量が表示される', async () => {
      const user = userEvent.setup();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        analysisHistory: [{ id: '1', timestamp: '2024-01-01', result: {} }],
        customQuestions: [{ id: '1', question: 'test', category: 'culture' }],
        feedbackHistory: { 'finding-1': 'positive' }
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      expect(screen.getByText('解析履歴: 1件')).toBeInTheDocument();
      expect(screen.getByText('カスタム質問: 1件')).toBeInTheDocument();
      expect(screen.getByText('フィードバック: 1件')).toBeInTheDocument();
    });

    test('エクスポートボタンが動作する', async () => {
      const user = userEvent.setup();
      const exportState = jest.fn(() => '{"test": "data"}');
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        exportState
      } as any);

      // createObjectURLとrevokeObjectURLのモック
      global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
      global.URL.revokeObjectURL = jest.fn();

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      const exportButton = screen.getByText('エクスポート');
      await user.click(exportButton);

      expect(exportState).toHaveBeenCalledTimes(1);
    });

    test('履歴クリアボタンが動作する', async () => {
      const user = userEvent.setup();
      const clearHistory = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        analysisHistory: [{ id: '1', timestamp: '2024-01-01', result: {} }],
        clearHistory
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      const clearButton = screen.getByText('履歴をクリア');
      await user.click(clearButton);

      // 確認ダイアログが表示される
      expect(screen.getByText('解析履歴をクリア')).toBeInTheDocument();

      const confirmButton = screen.getByText('確認');
      await user.click(confirmButton);

      expect(clearHistory).toHaveBeenCalledTimes(1);
    });

    test('履歴が空の場合はクリアボタンが無効化される', async () => {
      const user = userEvent.setup();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        analysisHistory: []
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      const clearButton = screen.getByText('履歴をクリア');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('プライバシー設定', () => {
    test('プライバシー情報が表示される', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const privacyTab = screen.getByRole('tab', { name: /プライバシー/i });
      await user.click(privacyTab);

      expect(screen.getByText('データ保存')).toBeInTheDocument();
      expect(screen.getByText('このアプリケーションは以下のデータをブラウザのローカルストレージに保存します：')).toBeInTheDocument();
    });
  });

  describe('詳細設定', () => {
    test('リセット機能が表示される', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const advancedTab = screen.getByRole('tab', { name: /詳細/i });
      await user.click(advancedTab);

      expect(screen.getByText('全設定リセット')).toBeInTheDocument();
      expect(screen.getByText('アプリケーション情報')).toBeInTheDocument();
    });

    test('全データリセットが動作する', async () => {
      const user = userEvent.setup();
      const resetState = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        resetState
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const advancedTab = screen.getByRole('tab', { name: /詳細/i });
      await user.click(advancedTab);

      const resetButton = screen.getByRole('button', { name: '全データをリセット' });
      await user.click(resetButton);

      // 確認ダイアログが表示される（ダイアログのタイトルを確認）
      expect(screen.getByRole('heading', { name: '全データをリセット' })).toBeInTheDocument();
      expect(screen.getByText('すべての設定、履歴、カスタム質問が削除されます。この操作は取り消せません。')).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: '確認' });
      await user.click(confirmButton);

      expect(resetState).toHaveBeenCalledTimes(1);
    });

    test('アプリケーション情報が表示される', async () => {
      const user = userEvent.setup();
      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const advancedTab = screen.getByRole('tab', { name: /詳細/i });
      await user.click(advancedTab);

      expect(screen.getByText('ブラック求人チェッカー v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Next.js App Router + TypeScript')).toBeInTheDocument();
    });
  });

  describe('確認ダイアログ', () => {
    test('キャンセルボタンでダイアログが閉じる', async () => {
      const user = userEvent.setup();
      const clearHistory = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        analysisHistory: [{ id: '1', timestamp: '2024-01-01', result: {} }],
        clearHistory
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      const clearButton = screen.getByText('履歴をクリア');
      await user.click(clearButton);

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      expect(screen.queryByText('解析履歴をクリア')).not.toBeInTheDocument();
      expect(clearHistory).not.toHaveBeenCalled();
    });
  });

  describe('ファイルインポート', () => {
    test('ファイル選択でインポートが実行される', async () => {
      const user = userEvent.setup();
      const importState = jest.fn();
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        importState
      } as any);

      render(<SettingsPanel isOpen={true} onClose={mockOnClose} />);

      const dataTab = screen.getByRole('tab', { name: /データ/i });
      await user.click(dataTab);

      const fileInput = screen.getByLabelText('インポート');
      const file = new File(['{"test": "data"}'], 'settings.json', { type: 'application/json' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(importState).toHaveBeenCalledWith('{"test": "data"}');
      });
    });
  });
});
