/**
 * ネットワークエラー表示コンポーネント
 * オフライン状態、リトライ機能、ユーザーフレンドリーなメッセージを提供
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  Server,
  Shield,
  Info,
  CheckCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  NetworkError,
  NetworkErrorType,
  useNetworkStatus,
  DelayCalculator
} from '../../utils/networkErrorHandler';

/**
 * ネットワークエラー表示のProps
 */
interface NetworkErrorDisplayProps {
  error: NetworkError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  autoRetry?: boolean;
  autoRetryDelay?: number;
  maxAutoRetries?: number;
  className?: string;
}

/**
 * エラータイプ別の設定
 */
const ERROR_TYPE_CONFIG = {
  [NetworkErrorType.OFFLINE]: {
    icon: WifiOff,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    badgeColor: 'secondary' as const,
    title: 'オフライン',
    description: 'インターネット接続が切断されています',
    actionText: '接続を確認',
    showProgress: false
  },
  [NetworkErrorType.TIMEOUT]: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    badgeColor: 'secondary' as const,
    title: 'タイムアウト',
    description: 'リクエストの処理に時間がかかりすぎています',
    actionText: '再試行',
    showProgress: true
  },
  [NetworkErrorType.SERVER_ERROR]: {
    icon: Server,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    badgeColor: 'destructive' as const,
    title: 'サーバーエラー',
    description: 'サーバーで問題が発生しています',
    actionText: '再試行',
    showProgress: true
  },
  [NetworkErrorType.RATE_LIMIT]: {
    icon: Shield,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    badgeColor: 'secondary' as const,
    title: 'レート制限',
    description: 'リクエスト制限に達しました',
    actionText: 'しばらく待つ',
    showProgress: true
  },
  [NetworkErrorType.CLIENT_ERROR]: {
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    badgeColor: 'destructive' as const,
    title: 'クライアントエラー',
    description: 'リクエストに問題があります',
    actionText: '確認',
    showProgress: false
  },
  [NetworkErrorType.NETWORK_ERROR]: {
    icon: Wifi,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    badgeColor: 'secondary' as const,
    title: 'ネットワークエラー',
    description: 'ネットワーク接続に問題があります',
    actionText: '再試行',
    showProgress: true
  },
  [NetworkErrorType.UNKNOWN]: {
    icon: AlertTriangle,
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
    badgeColor: 'secondary' as const,
    title: '不明なエラー',
    description: '予期しないエラーが発生しました',
    actionText: '再試行',
    showProgress: false
  }
};

/**
 * オンライン状態インジケーター
 */
function OnlineStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    setShowTransition(true);
    const timer = setTimeout(() => setShowTransition(false), 3000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!showTransition) return null;

  return (
    <Alert className={`mb-4 ${isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600" />
        )}
        <AlertDescription className={isOnline ? 'text-green-800' : 'text-orange-800'}>
          {isOnline ? 'インターネット接続が復旧しました' : 'インターネット接続が切断されました'}
        </AlertDescription>
      </div>
    </Alert>
  );
}

/**
 * 自動リトライプログレス
 */
interface AutoRetryProgressProps {
  isActive: boolean;
  delay: number;
  onComplete: () => void;
  onCancel: () => void;
}

function AutoRetryProgress({ isActive, delay, onComplete, onCancel }: AutoRetryProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(delay);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setTimeLeft(delay);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / delay) * 100;
      const newTimeLeft = Math.max(0, delay - elapsed);

      setProgress(Math.min(newProgress, 100));
      setTimeLeft(newTimeLeft);

      if (elapsed >= delay) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, delay, onComplete]);

  if (!isActive) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>自動再試行まで</span>
        <span>{Math.ceil(timeLeft / 1000)}秒</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}

/**
 * エラー詳細情報
 */
interface ErrorDetailsProps {
  error: NetworkError;
  showDetails: boolean;
  onToggle: () => void;
}

function ErrorDetails({ error, showDetails, onToggle }: ErrorDetailsProps) {
  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-muted-foreground"
      >
        <Info className="h-3 w-3 mr-1" />
        {showDetails ? '詳細を非表示' : '詳細を表示'}
      </Button>

      {showDetails && (
        <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>エラータイプ:</strong> {error.details.type}
            </div>
            <div>
              <strong>リトライ回数:</strong> {error.details.retryCount}
            </div>
            {error.details.status && (
              <div>
                <strong>ステータス:</strong> {error.details.status}
              </div>
            )}
            {error.details.url && (
              <div className="col-span-2">
                <strong>URL:</strong>
                <span className="break-all ml-1">{error.details.url}</span>
              </div>
            )}
          </div>
          <div>
            <strong>タイムスタンプ:</strong> {new Date(error.details.timestamp).toLocaleString()}
          </div>
          <div>
            <strong>メッセージ:</strong> {error.message}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * メインのネットワークエラー表示コンポーネント
 */
export function NetworkErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showRetryButton = true,
  showDismissButton = false,
  autoRetry = false,
  autoRetryDelay = 5000,
  maxAutoRetries = 3,
  className = ''
}: NetworkErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const isOnline = useNetworkStatus();

  const config = ERROR_TYPE_CONFIG[error.details.type];
  const IconComponent = config.icon;

  // オフライン状態では自動リトライを停止
  const shouldAutoRetry = autoRetry &&
    error.isRetryable() &&
    autoRetryCount < maxAutoRetries &&
    isOnline &&
    error.details.type !== NetworkErrorType.OFFLINE;

  // 自動リトライの開始
  useEffect(() => {
    if (shouldAutoRetry && !isAutoRetrying) {
      const delay = DelayCalculator.calculateDelay(
        autoRetryCount,
        autoRetryDelay,
        30000,
        1.5
      );

      setIsAutoRetrying(true);

      const timer = setTimeout(() => {
        setAutoRetryCount(prev => prev + 1);
        setIsAutoRetrying(false);
        onRetry?.();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoRetry, isAutoRetrying, autoRetryCount, autoRetryDelay, onRetry]);

  // オンライン状態が復旧した時の処理
  useEffect(() => {
    if (isOnline && error.details.type === NetworkErrorType.OFFLINE) {
      // オンライン復旧時は少し待ってから自動リトライ
      const timer = setTimeout(() => {
        onRetry?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, error.details.type, onRetry]);

  const handleManualRetry = () => {
    setAutoRetryCount(0);
    setIsAutoRetrying(false);
    onRetry?.();
  };

  const handleCancelAutoRetry = () => {
    setIsAutoRetrying(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <OnlineStatusIndicator />

      <Card>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className={`p-3 rounded-full ${config.color}`}>
              <IconComponent className="h-6 w-6" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-lg">{config.title}</CardTitle>
            <Badge variant={config.badgeColor} className="text-xs">
              {error.details.type}
            </Badge>
          </div>

          <p className="text-muted-foreground text-sm">
            {config.description}
          </p>

          {error.details.retryCount > 0 && (
            <Badge variant="outline" className="text-xs mt-2">
              リトライ回数: {error.details.retryCount}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ユーザーフレンドリーなメッセージ */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.getUserMessage()}
            </AlertDescription>
          </Alert>

          {/* 自動リトライプログレス */}
          {isAutoRetrying && (
            <AutoRetryProgress
              isActive={isAutoRetrying}
              delay={DelayCalculator.calculateDelay(autoRetryCount, autoRetryDelay, 30000, 1.5)}
              onComplete={() => setIsAutoRetrying(false)}
              onCancel={handleCancelAutoRetry}
            />
          )}

          {/* アクションボタン */}
          {!isAutoRetrying && (
            <div className="flex flex-wrap gap-2 justify-center">
              {showRetryButton && error.isRetryable() && (
                <Button
                  onClick={handleManualRetry}
                  className="flex items-center gap-2"
                  disabled={error.details.type === NetworkErrorType.OFFLINE && !isOnline}
                >
                  <RefreshCw className="h-4 w-4" />
                  {config.actionText}
                </Button>
              )}

              {showDismissButton && (
                <Button variant="outline" onClick={onDismiss}>
                  閉じる
                </Button>
              )}
            </div>
          )}

          {/* エラー詳細 */}
          <ErrorDetails
            error={error}
            showDetails={showDetails}
            onToggle={() => setShowDetails(!showDetails)}
          />

          {/* 解決のヒント */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
              解決方法のヒント
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              {error.details.type === NetworkErrorType.OFFLINE && (
                <>
                  <li>• Wi-Fi接続を確認してください</li>
                  <li>• モバイルデータ通信が有効か確認してください</li>
                  <li>• ルーターの電源を入れ直してみてください</li>
                </>
              )}
              {error.details.type === NetworkErrorType.TIMEOUT && (
                <>
                  <li>• インターネット接続の速度を確認してください</li>
                  <li>• 他のアプリケーションを閉じてみてください</li>
                  <li>• しばらく待ってから再試行してください</li>
                </>
              )}
              {error.details.type === NetworkErrorType.SERVER_ERROR && (
                <>
                  <li>• サーバーの一時的な問題の可能性があります</li>
                  <li>• しばらく待ってから再試行してください</li>
                  <li>• 問題が続く場合はサポートにお問い合わせください</li>
                </>
              )}
              {error.details.type === NetworkErrorType.RATE_LIMIT && (
                <>
                  <li>• リクエスト制限に達しています</li>
                  <li>• {Math.ceil(autoRetryDelay / 1000)}秒待ってから再試行してください</li>
                  <li>• 頻繁なリクエストを避けてください</li>
                </>
              )}
              {(error.details.type === NetworkErrorType.CLIENT_ERROR ||
                error.details.type === NetworkErrorType.UNKNOWN) && (
                <>
                  <li>• ページを再読み込みしてみてください</li>
                  <li>• ブラウザのキャッシュをクリアしてみてください</li>
                  <li>• 問題が続く場合はサポートにお問い合わせください</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 軽量版のネットワークエラー表示（トースト用）
 */
interface NetworkErrorToastProps {
  error: NetworkError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function NetworkErrorToast({ error, onRetry, onDismiss }: NetworkErrorToastProps) {
  const config = ERROR_TYPE_CONFIG[error.details.type];
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-3 p-3">
      <div className={`p-2 rounded-full ${config.color}`}>
        <IconComponent className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{config.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {error.getUserMessage()}
        </p>
      </div>

      <div className="flex gap-1">
        {error.isRetryable() && onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            ×
          </Button>
        )}
      </div>
    </div>
  );
}
