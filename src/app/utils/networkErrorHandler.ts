/**
 * ネットワークエラーハンドリングユーティリティ
 * リトライ機能、オフライン対応、タイムアウト処理を提供
 */

/**
 * ネットワークエラーの種類
 */
export enum NetworkErrorType {
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * ネットワークエラーの詳細情報
 */
export interface NetworkErrorDetails {
  type: NetworkErrorType;
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
  timestamp: string;
  retryCount: number;
  isRetryable: boolean;
}

/**
 * リトライ設定
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: NetworkErrorType[];
}

/**
 * フェッチ設定
 */
export interface FetchConfig extends RequestInit {
  timeout?: number;
  retryConfig?: Partial<RetryConfig>;
  onRetry?: (error: NetworkErrorDetails, retryCount: number) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * デフォルトのリトライ設定
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    NetworkErrorType.TIMEOUT,
    NetworkErrorType.NETWORK_ERROR,
    NetworkErrorType.SERVER_ERROR
  ]
};

/**
 * ネットワーク状態管理クラス
 */
class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }
}

/**
 * エラー分類ユーティリティ
 */
export class NetworkErrorClassifier {
  /**
   * エラーを分類
   */
  static classifyError(error: any, response?: Response): NetworkErrorDetails {
    const timestamp = new Date().toISOString();
    let type: NetworkErrorType;
    let message: string;
    let status: number | undefined;
    let statusText: string | undefined;
    let isRetryable = false;

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      type = NetworkErrorType.TIMEOUT;
      message = 'リクエストがタイムアウトしました';
      isRetryable = true;
    } else if (!NetworkStatusManager.getInstance().getStatus()) {
      type = NetworkErrorType.OFFLINE;
      message = 'インターネット接続がありません';
      isRetryable = true;
    } else if (response) {
      status = response.status;
      statusText = response.statusText;

      if (status >= 500) {
        type = NetworkErrorType.SERVER_ERROR;
        message = `サーバーエラーが発生しました (${status})`;
        isRetryable = true;
      } else if (status === 429) {
        type = NetworkErrorType.RATE_LIMIT;
        message = 'リクエスト制限に達しました。しばらく待ってから再試行してください';
        isRetryable = true;
      } else if (status >= 400) {
        type = NetworkErrorType.CLIENT_ERROR;
        message = `クライアントエラーが発生しました (${status})`;
        isRetryable = false;
      } else {
        type = NetworkErrorType.UNKNOWN;
        message = `予期しないエラーが発生しました (${status})`;
        isRetryable = false;
      }
    } else if (error.message?.includes('fetch')) {
      type = NetworkErrorType.NETWORK_ERROR;
      message = 'ネットワークエラーが発生しました';
      isRetryable = true;
    } else {
      type = NetworkErrorType.UNKNOWN;
      message = error.message || '予期しないエラーが発生しました';
      isRetryable = false;
    }

    return {
      type,
      message,
      status,
      statusText,
      timestamp,
      retryCount: 0,
      isRetryable
    };
  }

  /**
   * エラーがリトライ可能かチェック
   */
  static isRetryable(errorType: NetworkErrorType, retryableErrors: NetworkErrorType[]): boolean {
    return retryableErrors.includes(errorType);
  }
}

/**
 * 遅延ユーティリティ
 */
export class DelayCalculator {
  /**
   * 指数バックオフによる遅延時間を計算
   */
  static calculateDelay(
    retryCount: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number
  ): number {
    const delay = baseDelay * Math.pow(backoffMultiplier, retryCount);
    return Math.min(delay, maxDelay);
  }

  /**
   * ジッターを追加した遅延時間を計算
   */
  static addJitter(delay: number, jitterFactor: number = 0.1): number {
    const jitter = delay * jitterFactor * Math.random();
    return delay + jitter;
  }
}

/**
 * タイムアウト付きフェッチ
 */
export function fetchWithTimeout(
  url: string,
  options: FetchConfig = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('Request timeout'));
    }, timeout);

    fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * リトライ機能付きフェッチ
 */
export async function fetchWithRetry(
  url: string,
  options: FetchConfig = {}
): Promise<Response> {
  const {
    retryConfig: userRetryConfig = {},
    onRetry,
    onOffline,
    onOnline,
    ...fetchOptions
  } = options;

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...userRetryConfig };
  let lastError: NetworkErrorDetails | null = null;

  // オフライン/オンライン状態の監視
  const networkManager = NetworkStatusManager.getInstance();
  let isOfflineNotified = false;

  const removeNetworkListener = networkManager.addListener((isOnline) => {
    if (isOnline && isOfflineNotified) {
      onOnline?.();
      isOfflineNotified = false;
    } else if (!isOnline && !isOfflineNotified) {
      onOffline?.();
      isOfflineNotified = true;
    }
  });

  try {
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // オフライン状態の場合は待機
        if (!networkManager.getStatus()) {
          if (!isOfflineNotified) {
            onOffline?.();
            isOfflineNotified = true;
          }

          // オンラインになるまで待機（最大30秒）
          await new Promise((resolve) => {
            const checkOnline = () => {
              if (networkManager.getStatus()) {
                resolve(void 0);
              } else {
                setTimeout(checkOnline, 1000);
              }
            };
            setTimeout(() => resolve(void 0), 30000); // 30秒でタイムアウト
            checkOnline();
          });
        }

        const response = await fetchWithTimeout(url, fetchOptions);

        // 成功時はリスナーを削除
        removeNetworkListener();

        // レスポンスが正常でない場合はエラーとして扱う
        if (!response.ok) {
          const errorDetails = NetworkErrorClassifier.classifyError(null, response);
          errorDetails.url = url;
          errorDetails.retryCount = attempt;

          if (
            attempt < retryConfig.maxRetries &&
            NetworkErrorClassifier.isRetryable(errorDetails.type, retryConfig.retryableErrors)
          ) {
            lastError = errorDetails;
            onRetry?.(errorDetails, attempt + 1);

            const delay = DelayCalculator.calculateDelay(
              attempt,
              retryConfig.baseDelay,
              retryConfig.maxDelay,
              retryConfig.backoffMultiplier
            );

            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw new NetworkError(errorDetails);
        }

        return response;
      } catch (error) {
        const errorDetails = NetworkErrorClassifier.classifyError(error);
        errorDetails.url = url;
        errorDetails.retryCount = attempt;

        if (
          attempt < retryConfig.maxRetries &&
          NetworkErrorClassifier.isRetryable(errorDetails.type, retryConfig.retryableErrors)
        ) {
          lastError = errorDetails;
          onRetry?.(errorDetails, attempt + 1);

          const delay = DelayCalculator.calculateDelay(
            attempt,
            retryConfig.baseDelay,
            retryConfig.maxDelay,
            retryConfig.backoffMultiplier
          );

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        removeNetworkListener();
        throw new NetworkError(errorDetails);
      }
    }

    // すべてのリトライが失敗した場合
    removeNetworkListener();
    throw new NetworkError(lastError!);
  } finally {
    removeNetworkListener();
  }
}

/**
 * カスタムネットワークエラークラス
 */
export class NetworkError extends Error {
  public readonly details: NetworkErrorDetails;

  constructor(details: NetworkErrorDetails) {
    super(details.message);
    this.name = 'NetworkError';
    this.details = details;
  }

  /**
   * エラーがリトライ可能かチェック
   */
  isRetryable(): boolean {
    return this.details.isRetryable;
  }

  /**
   * エラーの種類を取得
   */
  getType(): NetworkErrorType {
    return this.details.type;
  }

  /**
   * ユーザーフレンドリーなメッセージを取得
   */
  getUserMessage(): string {
    switch (this.details.type) {
      case NetworkErrorType.OFFLINE:
        return 'インターネット接続を確認してください';
      case NetworkErrorType.TIMEOUT:
        return 'リクエストがタイムアウトしました。再試行してください';
      case NetworkErrorType.SERVER_ERROR:
        return 'サーバーで問題が発生しています。しばらく待ってから再試行してください';
      case NetworkErrorType.RATE_LIMIT:
        return 'リクエスト制限に達しました。しばらく待ってから再試行してください';
      case NetworkErrorType.CLIENT_ERROR:
        return 'リクエストに問題があります';
      default:
        return 'ネットワークエラーが発生しました';
    }
  }
}

/**
 * ネットワーク状態フック
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const networkManager = NetworkStatusManager.getInstance();
    setIsOnline(networkManager.getStatus());

    const removeListener = networkManager.addListener(setIsOnline);
    return removeListener;
  }, []);

  return isOnline;
}

/**
 * リトライ可能なフェッチフック
 */
export function useRetryableFetch() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<NetworkError | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const fetchData = React.useCallback(async (
    url: string,
    options: FetchConfig = {}
  ) => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const response = await fetchWithRetry(url, {
        ...options,
        onRetry: (errorDetails, currentRetryCount) => {
          setRetryCount(currentRetryCount);
          options.onRetry?.(errorDetails, currentRetryCount);
        }
      });

      setIsLoading(false);
      return response;
    } catch (err) {
      setIsLoading(false);
      const networkError = err instanceof NetworkError ? err : new NetworkError(
        NetworkErrorClassifier.classifyError(err)
      );
      setError(networkError);
      throw networkError;
    }
  }, []);

  const retry = React.useCallback(() => {
    if (error) {
      setError(null);
      setRetryCount(0);
    }
  }, [error]);

  return {
    fetchData,
    isLoading,
    error,
    retryCount,
    retry
  };
}

// React import for hooks
import React from 'react';
