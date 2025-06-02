/**
 * ユーザー設定パネルコンポーネント
 * 表示設定、テーマ切り替え、データ管理などの機能を提供
 */
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';
import { useDeviceDetection } from '@/app/utils/deviceDetection';
import {
  X,
  Settings,
  Palette,
  Zap,
  Eye,
  Database,
  Shield,
  Info,
  AlertTriangle,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Smartphone
} from 'lucide-react';
// インポートは実際に使用されるモジュールのみ残す
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
// Progress は使用されていないため削除
import { Switch } from '../ui/switch';
// Slider は使用されていないため削除
// Select関連コンポーネントは使用されていないため削除
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
// Textarea は使用されていないため削除

/**
 * 設定カテゴリ
 */
type SettingsCategory = 'appearance' | 'behavior' | 'data' | 'privacy' | 'advanced';

// ThemeOption型は使用されていないため削除

// LanguageOption型は使用されていないため削除

/**
 * 設定パネルのプロパティ
 */
interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/**
 * 設定項目コンポーネント
 */
interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: string;
}

function SettingItem({ icon, title, description, children, badge }: SettingItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{title}</h4>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * 確認ダイアログコンポーネント
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background border rounded-lg p-6 max-w-md mx-4"
      >
        <div className="flex items-center gap-3 mb-4">
          {variant === 'destructive' ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <Info className="h-5 w-5 text-blue-600" />
          )}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 設定パネルメインコンポーネント
 */
export function SettingsPanel({ isOpen, onClose, className = '' }: SettingsPanelProps) {
  const { deviceType } = useDeviceDetection();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    variant: 'default'
  });

  // Zustandストアから状態とアクションを取得
  const {
    enableAnimations,
    showAdvancedProgress,
    isDarkMode,
    isCompactView,
    analysisHistory,
    feedbackHistory,
    customQuestions,
    toggleAnimations,
    toggleAdvancedProgress,
    toggleDarkMode,
    toggleCompactView,
    clearHistory,
    clearFeedback,
    resetState,
    exportState,
    importState
  } = useAppStore();

  /**
   * データエクスポート
   */
  const handleExportData = () => {
    try {
      const data = exportState();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job-decoder-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  /**
   * データインポート
   */
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        importState(data);
        setConfirmDialog({
          isOpen: true,
          title: 'インポート完了',
          message: '設定データが正常にインポートされました。',
          action: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        });
      } catch (error) {
        console.error('Failed to import data:', error);
        setConfirmDialog({
          isOpen: true,
          title: 'インポートエラー',
          message: 'ファイルの読み込みに失敗しました。正しいファイルを選択してください。',
          action: () => setConfirmDialog(prev => ({ ...prev, isOpen: false })),
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
  };

  /**
   * 全データリセット
   */
  const handleResetAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: '全データをリセット',
      message: 'すべての設定、履歴、カスタム質問が削除されます。この操作は取り消せません。',
      action: () => {
        resetState();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'destructive'
    });
  };

  /**
   * 履歴クリア
   */
  const handleClearHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: '解析履歴をクリア',
      message: 'すべての解析履歴が削除されます。この操作は取り消せません。',
      action: () => {
        clearHistory();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'destructive'
    });
  };

  /**
   * フィードバッククリア
   */
  const handleClearFeedback = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'フィードバック履歴をクリア',
      message: 'すべてのフィードバック履歴が削除されます。この操作は取り消せません。',
      action: () => {
        clearFeedback();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'destructive'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`
          fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l z-50 overflow-y-auto
          ${className}
        `}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">設定</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as SettingsCategory)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="appearance" className="flex items-center gap-1">
                <Palette className="h-3 w-3" />
                <span className="hidden sm:inline">外観</span>
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="hidden sm:inline">動作</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                <span className="hidden sm:inline">データ</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span className="hidden sm:inline">プライバシー</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">詳細</span>
              </TabsTrigger>
            </TabsList>

            {/* 外観設定 */}
            <TabsContent value="appearance" className="space-y-4 mt-6">
              <SettingItem
                icon={<Palette className="h-4 w-4" />}
                title="テーマ"
                description="アプリケーションの外観テーマを選択します"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant={!isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !isDarkMode || toggleDarkMode()}
                    className="flex items-center gap-2"
                  >
                    <Sun className="h-3 w-3" />
                    ライト
                  </Button>
                  <Button
                    variant={isDarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => isDarkMode || toggleDarkMode()}
                    className="flex items-center gap-2"
                  >
                    <Moon className="h-3 w-3" />
                    ダーク
                  </Button>
                </div>
              </SettingItem>

              <SettingItem
                icon={<Eye className="h-4 w-4" />}
                title="表示密度"
                description="コンテンツの表示密度を調整します"
              >
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isCompactView}
                    onCheckedChange={toggleCompactView}
                  />
                  <Label>コンパクト表示</Label>
                </div>
              </SettingItem>

              <SettingItem
                icon={<Monitor className="h-4 w-4" />}
                title="レスポンシブ表示"
                description="現在のデバイス情報"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {deviceType === 'mobile' && <Smartphone className="h-4 w-4" />}
                  {deviceType === 'tablet' && <Monitor className="h-4 w-4" />}
                  {deviceType === 'desktop' && <Monitor className="h-4 w-4" />}
                  <span className="capitalize">{deviceType}</span>
                </div>
              </SettingItem>
            </TabsContent>

            {/* 動作設定 */}
            <TabsContent value="behavior" className="space-y-4 mt-6">
              <SettingItem
                icon={<Zap className="h-4 w-4" />}
                title="アニメーション"
                description="画面遷移やエフェクトのアニメーションを制御します"
              >
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enableAnimations}
                    onCheckedChange={toggleAnimations}
                  />
                  <Label>アニメーションを有効にする</Label>
                </div>
              </SettingItem>

              <SettingItem
                icon={<Info className="h-4 w-4" />}
                title="詳細進捗表示"
                description="解析時に詳細な進捗情報を表示します"
              >
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showAdvancedProgress}
                    onCheckedChange={toggleAdvancedProgress}
                  />
                  <Label>詳細進捗を表示</Label>
                </div>
              </SettingItem>
            </TabsContent>

            {/* データ管理 */}
            <TabsContent value="data" className="space-y-4 mt-6">
              <SettingItem
                icon={<Database className="h-4 w-4" />}
                title="ストレージ使用量"
                description="ローカルストレージの使用状況"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>解析履歴: {analysisHistory.length}件</span>
                    <span>カスタム質問: {customQuestions.length}件</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>フィードバック: {Object.keys(feedbackHistory).length}件</span>
                  </div>
                </div>
              </SettingItem>

              <SettingItem
                icon={<Download className="h-4 w-4" />}
                title="データエクスポート"
                description="設定と履歴をファイルに保存します"
              >
                <Button onClick={handleExportData} className="flex items-center gap-2">
                  <Download className="h-3 w-3" />
                  エクスポート
                </Button>
              </SettingItem>

              <SettingItem
                icon={<Upload className="h-4 w-4" />}
                title="データインポート"
                description="以前にエクスポートしたファイルから設定を復元します"
              >
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button asChild className="flex items-center gap-2">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-3 w-3" />
                      インポート
                    </label>
                  </Button>
                </div>
              </SettingItem>

              <Separator />

              <SettingItem
                icon={<Trash2 className="h-4 w-4" />}
                title="履歴クリア"
                description="解析履歴を削除します"
              >
                <Button
                  variant="outline"
                  onClick={handleClearHistory}
                  disabled={analysisHistory.length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  履歴をクリア
                </Button>
              </SettingItem>

              <SettingItem
                icon={<Trash2 className="h-4 w-4" />}
                title="フィードバッククリア"
                description="フィードバック履歴を削除します"
              >
                <Button
                  variant="outline"
                  onClick={handleClearFeedback}
                  disabled={Object.keys(feedbackHistory).length === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  フィードバックをクリア
                </Button>
              </SettingItem>
            </TabsContent>

            {/* プライバシー設定 */}
            <TabsContent value="privacy" className="space-y-4 mt-6">
              <SettingItem
                icon={<Shield className="h-4 w-4" />}
                title="データ保存"
                description="ローカルストレージにデータを保存します"
              >
                <div className="text-sm text-muted-foreground">
                  <p>このアプリケーションは以下のデータをブラウザのローカルストレージに保存します：</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>解析履歴</li>
                    <li>ユーザー設定</li>
                    <li>フィードバック履歴</li>
                    <li>カスタム質問</li>
                  </ul>
                  <p className="mt-2">データは外部サーバーに送信されません。</p>
                </div>
              </SettingItem>
            </TabsContent>

            {/* 詳細設定 */}
            <TabsContent value="advanced" className="space-y-4 mt-6">
              <SettingItem
                icon={<RotateCcw className="h-4 w-4" />}
                title="全設定リセット"
                description="すべての設定と履歴を初期状態に戻します"
                badge="危険"
              >
                <Button
                  variant="destructive"
                  onClick={handleResetAll}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  全データをリセット
                </Button>
              </SettingItem>

              <SettingItem
                icon={<Info className="h-4 w-4" />}
                title="アプリケーション情報"
                description="バージョンと技術情報"
              >
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>求人票デコーダー v1.0.0</p>
                  <p>Next.js App Router + TypeScript</p>
                  <p>Tailwind CSS + Shadcn/ui</p>
                  <p>Zustand + Framer Motion</p>
                </div>
              </SettingItem>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.action}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            variant={confirmDialog.variant}
          />
        )}
      </AnimatePresence>
    </>
  );
}
