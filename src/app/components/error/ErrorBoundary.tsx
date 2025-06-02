/**
 * React Error Boundary コンポーネント
 * アプリケーション全体のエラーをキャッチし、適切なフォールバックUIを表示
 */
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

/**
 * エラー情報の型定義
 */
interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

/**
 * Error Boundary の Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  level?: 'page' | 'component' | 'critical';
}

/**
 * Error Boundary の State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
  reportSent: boolean;
  showDetails: boolean;
  copied: boolean;
}

/**
 * エラーレベル別の設定
 */
const ERROR_LEVEL_CONFIG = {
  page: {
    title: 'ページエラーが発生しました',
    description: 'このページの読み込み中にエラーが発生しました。',
    icon: AlertTriangle,
    color: 'destructive' as const,
    showReload: true,
    showHome: true
  },
  component: {
    title: 'コンポーネントエラー',
    description: 'この機能の実行中にエラーが発生しました。',
    icon: Bug,
    color: 'secondary' as const,
    showReload: false,
    showHome: false
  },
  critical: {
    title: '重大なエラーが発生しました',
    description: 'アプリケーションの実行を続行できません。',
    icon: AlertTriangle,
    color: 'destructive' as const,
    showReload: true,
    showHome: true
  }
};

/**
 * エラー報告用のユーティリティ関数
 */
class ErrorReporter {
  /**
   * エラーIDを生成
   */
  static generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * エラー詳細を収集
   */
  static collectErrorDetails(error: Error, errorInfo: ErrorInfo): ErrorDetails {
    return {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };
  }

  /**
   * エラーをローカルストレージに保存
   */
  static saveErrorLocally(errorId: string, errorDetails: ErrorDetails): void {
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push({ id: errorId, ...errorDetails });

      // 最大10件まで保持
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }

      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to save error locally:', e);
    }
  }

  /**
   * エラー報告（将来的にはサーバーに送信）
   */
  static async reportError(errorId: string, errorDetails: ErrorDetails): Promise<boolean> {
    try {
      // 現在はローカル保存のみ
      this.saveErrorLocally(errorId, errorDetails);

      // 将来的にはここでサーバーに送信
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ id: errorId, ...errorDetails })
      // });

      return true;
    } catch (e) {
      console.error('Failed to report error:', e);
      return false;
    }
  }
}

/**
 * フォールバックUIコンポーネント
 */
interface FallbackUIProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  level: 'page' | 'component' | 'critical';
  onRetry: () => void;
  onReport: () => void;
  isReporting: boolean;
  reportSent: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
  onCopyError: () => void;
  copied: boolean;
}

function FallbackUI({
  error,
  errorInfo,
  errorId,
  level,
  onRetry,
  onReport,
  isReporting,
  reportSent,
  showDetails,
  onToggleDetails,
  onCopyError,
  copied
}: FallbackUIProps) {
  const config = ERROR_LEVEL_CONFIG[level];
  const IconComponent = config.icon;

  const errorDetails = ErrorReporter.collectErrorDetails(error, errorInfo);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${
              config.color === 'destructive'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              <IconComponent className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">
            {config.title}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            {config.description}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              エラーID: {errorId}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleString()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* アクションボタン */}
          <div className="flex flex-wrap gap-2 justify-center">
            {config.showReload && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                再試行
              </Button>
            )}

            {config.showHome && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                ホームに戻る
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onReport}
              disabled={isReporting || reportSent}
              className="flex items-center gap-2"
            >
              {isReporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : reportSent ? (
                <Check className="h-4 w-4" />
              ) : (
                <Bug className="h-4 w-4" />
              )}
              {isReporting ? '報告中...' : reportSent ? '報告済み' : 'エラー報告'}
            </Button>
          </div>

          {/* エラー詳細の表示切り替え */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDetails}
              className="text-muted-foreground"
            >
              {showDetails ? '詳細を非表示' : '詳細を表示'}
            </Button>
          </div>

          {/* エラー詳細 */}
          {showDetails && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">エラー詳細</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCopyError}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? 'コピー済み' : 'コピー'}
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto max-h-60">
                <div className="space-y-2">
                  <div>
                    <strong>メッセージ:</strong> {error.message}
                  </div>
                  <div>
                    <strong>タイムスタンプ:</strong> {errorDetails.timestamp}
                  </div>
                  <div>
                    <strong>URL:</strong> {errorDetails.url}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>スタックトレース:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo.componentStack && (
                    <div>
                      <strong>コンポーネントスタック:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ユーザー向けのヒント */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              解決方法のヒント
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• ページを再読み込みしてみてください</li>
              <li>• ブラウザのキャッシュをクリアしてみてください</li>
              <li>• 問題が続く場合は、エラー報告をお送りください</li>
              <li>• 一時的な問題の可能性があります。しばらく待ってから再試行してください</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Error Boundary メインクラス
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSent: false,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: ErrorReporter.generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // カスタムエラーハンドラーを呼び出し
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // コンソールにエラーを出力
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      reportSent: false,
      showDetails: false,
      copied: false
    });
  };

  handleReport = async () => {
    if (!this.state.error || !this.state.errorInfo || !this.state.errorId) return;

    this.setState({ isReporting: true });

    const errorDetails = ErrorReporter.collectErrorDetails(
      this.state.error,
      this.state.errorInfo
    );

    const success = await ErrorReporter.reportError(this.state.errorId, errorDetails);

    this.setState({
      isReporting: false,
      reportSent: success
    });
  };

  handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  handleCopyError = async () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = ErrorReporter.collectErrorDetails(
      this.state.error,
      this.state.errorInfo
    );

    const errorText = `
エラーID: ${this.state.errorId}
メッセージ: ${errorDetails.message}
タイムスタンプ: ${errorDetails.timestamp}
URL: ${errorDetails.url}

スタックトレース:
${errorDetails.stack || 'なし'}

コンポーネントスタック:
${errorDetails.componentStack || 'なし'}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (e) {
      console.error('Failed to copy error details:', e);
    }
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのフォールバックUIを表示
      if (this.state.error && this.state.errorInfo && this.state.errorId) {
        return (
          <FallbackUI
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            level={this.props.level || 'page'}
            onRetry={this.handleRetry}
            onReport={this.handleReport}
            isReporting={this.state.isReporting}
            reportSent={this.state.reportSent}
            showDetails={this.state.showDetails}
            onToggleDetails={this.handleToggleDetails}
            onCopyError={this.handleCopyError}
            copied={this.state.copied}
          />
        );
      }
    }

    return this.props.children;
  }
}

/**
 * 関数コンポーネント版のError Boundary（HOC）
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * エラー境界のフック（エラー情報の取得用）
 */
export function useErrorBoundary() {
  return {
    reportError: (error: Error, errorInfo?: ErrorInfo) => {
      const errorId = ErrorReporter.generateErrorId();
      const errorDetails = ErrorReporter.collectErrorDetails(
        error,
        errorInfo || { componentStack: '' }
      );
      ErrorReporter.reportError(errorId, errorDetails);
    },
    getStoredErrors: () => {
      try {
        return JSON.parse(localStorage.getItem('app_errors') || '[]');
      } catch {
        return [];
      }
    },
    clearStoredErrors: () => {
      localStorage.removeItem('app_errors');
    }
  };
}
