/**
 * ネットワークエラーハンドリングユーティリティのテスト
 */

import {
  NetworkError,
  NetworkErrorType,
  NetworkErrorClassifier,
  DelayCalculator,
  fetchWithTimeout,
  fetchWithRetry
} from '../networkErrorHandler';

// fetch のモック
global.fetch = jest.fn();

// AbortController のモック
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
})) as any;

// navigator.onLine のモック
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// window.addEventListener のモック
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
});

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
  navigator.onLine = true;
});

describe('NetworkError', () => {
  it('エラー詳細を正しく保持する', () => {
    const errorDetails = {
      type: NetworkErrorType.TIMEOUT,
      message: 'Request timeout',
      timestamp: '2023-01-01T00:00:00.000Z',
      retryCount: 1,
      isRetryable: true
    };

    const networkError = new NetworkError(errorDetails);

    expect(networkError.message).toBe('Request timeout');
    expect(networkError.name).toBe('NetworkError');
    expect(networkError.details).toEqual(errorDetails);
  });

  it('isRetryable()が正しく動作する', () => {
    const retryableError = new NetworkError({
      type: NetworkErrorType.TIMEOUT,
      message: 'Timeout',
      timestamp: '2023-01-01T00:00:00.000Z',
      retryCount: 0,
      isRetryable: true
    });

    const nonRetryableError = new NetworkError({
      type: NetworkErrorType.CLIENT_ERROR,
      message: 'Bad request',
      timestamp: '2023-01-01T00:00:00.000Z',
      retryCount: 0,
      isRetryable: false
    });

    expect(retryableError.isRetryable()).toBe(true);
    expect(nonRetryableError.isRetryable()).toBe(false);
  });

  it('getType()が正しく動作する', () => {
    const error = new NetworkError({
      type: NetworkErrorType.SERVER_ERROR,
      message: 'Server error',
      timestamp: '2023-01-01T00:00:00.000Z',
      retryCount: 0,
      isRetryable: true
    });

    expect(error.getType()).toBe(NetworkErrorType.SERVER_ERROR);
  });

  it('getUserMessage()が適切なメッセージを返す', () => {
    const testCases = [
      {
        type: NetworkErrorType.OFFLINE,
        expected: 'インターネット接続を確認してください'
      },
      {
        type: NetworkErrorType.TIMEOUT,
        expected: 'リクエストがタイムアウトしました。再試行してください'
      },
      {
        type: NetworkErrorType.SERVER_ERROR,
        expected: 'サーバーで問題が発生しています。しばらく待ってから再試行してください'
      },
      {
        type: NetworkErrorType.RATE_LIMIT,
        expected: 'リクエスト制限に達しました。しばらく待ってから再試行してください'
      },
      {
        type: NetworkErrorType.CLIENT_ERROR,
        expected: 'リクエストに問題があります'
      },
      {
        type: NetworkErrorType.UNKNOWN,
        expected: 'ネットワークエラーが発生しました'
      }
    ];

    testCases.forEach(({ type, expected }) => {
      const error = new NetworkError({
        type,
        message: 'Test message',
        timestamp: '2023-01-01T00:00:00.000Z',
        retryCount: 0,
        isRetryable: false
      });

      expect(error.getUserMessage()).toBe(expected);
    });
  });
});

describe('NetworkErrorClassifier', () => {
  it('タイムアウトエラーを正しく分類する', () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'AbortError';

    const result = NetworkErrorClassifier.classifyError(timeoutError);

    expect(result.type).toBe(NetworkErrorType.TIMEOUT);
    expect(result.message).toBe('リクエストがタイムアウトしました');
    expect(result.isRetryable).toBe(true);
  });

  it('サーバーエラーを正しく分類する', () => {
    const response = new Response('Internal Server Error', { status: 500 });
    const result = NetworkErrorClassifier.classifyError(null, response);

    expect(result.type).toBe(NetworkErrorType.SERVER_ERROR);
    expect(result.message).toBe('サーバーエラーが発生しました (500)');
    expect(result.isRetryable).toBe(true);
  });

  it('レート制限エラーを正しく分類する', () => {
    const response = new Response('Too Many Requests', { status: 429 });
    const result = NetworkErrorClassifier.classifyError(null, response);

    expect(result.type).toBe(NetworkErrorType.RATE_LIMIT);
    expect(result.message).toBe('リクエスト制限に達しました。しばらく待ってから再試行してください');
    expect(result.isRetryable).toBe(true);
  });

  it('クライアントエラーを正しく分類する', () => {
    const response = new Response('Bad Request', { status: 400 });
    const result = NetworkErrorClassifier.classifyError(null, response);

    expect(result.type).toBe(NetworkErrorType.CLIENT_ERROR);
    expect(result.message).toBe('クライアントエラーが発生しました (400)');
    expect(result.isRetryable).toBe(false);
  });

  it('ネットワークエラーを正しく分類する', () => {
    const networkError = new Error('fetch failed');
    const result = NetworkErrorClassifier.classifyError(networkError);

    expect(result.type).toBe(NetworkErrorType.NETWORK_ERROR);
    expect(result.message).toBe('ネットワークエラーが発生しました');
    expect(result.isRetryable).toBe(true);
  });

  it('オフライン状態を正しく分類する', () => {
    navigator.onLine = false;
    const error = new Error('Network error');
    const result = NetworkErrorClassifier.classifyError(error);

    expect(result.type).toBe(NetworkErrorType.OFFLINE);
    expect(result.message).toBe('インターネット接続がありません');
    expect(result.isRetryable).toBe(true);
  });

  it('isRetryable()が正しく動作する', () => {
    const retryableTypes = [
      NetworkErrorType.TIMEOUT,
      NetworkErrorType.NETWORK_ERROR,
      NetworkErrorType.SERVER_ERROR
    ];

    const nonRetryableTypes = [
      NetworkErrorType.CLIENT_ERROR
    ];

    retryableTypes.forEach(type => {
      expect(NetworkErrorClassifier.isRetryable(type, retryableTypes)).toBe(true);
    });

    nonRetryableTypes.forEach(type => {
      expect(NetworkErrorClassifier.isRetryable(type, retryableTypes)).toBe(false);
    });
  });
});

describe('DelayCalculator', () => {
  it('指数バックオフによる遅延時間を正しく計算する', () => {
    const baseDelay = 1000;
    const maxDelay = 10000;
    const backoffMultiplier = 2;

    expect(DelayCalculator.calculateDelay(0, baseDelay, maxDelay, backoffMultiplier)).toBe(1000);
    expect(DelayCalculator.calculateDelay(1, baseDelay, maxDelay, backoffMultiplier)).toBe(2000);
    expect(DelayCalculator.calculateDelay(2, baseDelay, maxDelay, backoffMultiplier)).toBe(4000);
    expect(DelayCalculator.calculateDelay(3, baseDelay, maxDelay, backoffMultiplier)).toBe(8000);
    expect(DelayCalculator.calculateDelay(4, baseDelay, maxDelay, backoffMultiplier)).toBe(10000); // maxDelayで制限
  });

  it('ジッターを追加した遅延時間を計算する', () => {
    const delay = 1000;
    const jitterFactor = 0.1;

    const result = DelayCalculator.addJitter(delay, jitterFactor);

    expect(result).toBeGreaterThanOrEqual(delay);
    expect(result).toBeLessThanOrEqual(delay * (1 + jitterFactor));
  });
});

describe('fetchWithTimeout', () => {
  it('正常なレスポンスを返す', async () => {
    const mockResponse = new Response('success');
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com');

    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
      signal: expect.any(Object)
    }));
  });

  it('タイムアウト時にエラーを投げる', async () => {
    (fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 2000))
    );

    await expect(fetchWithTimeout('https://example.com', { timeout: 100 }))
      .rejects.toThrow('Request timeout');
  });

  it('fetchエラーを正しく伝播する', async () => {
    const fetchError = new Error('Network error');
    (fetch as jest.Mock).mockRejectedValue(fetchError);

    await expect(fetchWithTimeout('https://example.com'))
      .rejects.toThrow('Network error');
  });
});

describe('fetchWithRetry', () => {
  it('成功時は結果を返す', async () => {
    const mockResponse = new Response('success');
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com');

    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('リトライ可能なエラーの場合はリトライする', async () => {
    const timeoutError = new Error('Request timeout');
    const mockResponse = new Response('success');

    (fetch as jest.Mock)
      .mockRejectedValueOnce(timeoutError)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com', {
      retryConfig: {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
      }
    });

    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('リトライ不可能なエラーの場合は即座に失敗する', async () => {
    const clientError = new Response('Bad Request', { status: 400 });
    (fetch as jest.Mock).mockResolvedValue(clientError);

    await expect(fetchWithRetry('https://example.com', {
      retryConfig: {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
      }
    })).rejects.toThrow(NetworkError);

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('最大リトライ回数に達した場合は失敗する', async () => {
    const timeoutError = new Error('Request timeout');
    (fetch as jest.Mock).mockRejectedValue(timeoutError);

    await expect(fetchWithRetry('https://example.com', {
      retryConfig: {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
      }
    })).rejects.toThrow(NetworkError);

    expect(fetch).toHaveBeenCalledTimes(3); // 初回 + 2回のリトライ
  });

  it('onRetryコールバックが呼び出される', async () => {
    const timeoutError = new Error('Request timeout');
    const mockResponse = new Response('success');
    const onRetry = jest.fn();

    (fetch as jest.Mock)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValue(mockResponse);

    await fetchWithRetry('https://example.com', {
      onRetry,
      retryConfig: {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
      }
    });

    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NetworkErrorType.TIMEOUT,
        retryCount: 0
      }),
      1
    );
  });

  it('オフライン状態では待機する', async () => {
    navigator.onLine = false;
    const mockResponse = new Response('success');
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const onOffline = jest.fn();
    const onOnline = jest.fn();

    // オンライン状態に戻すタイマーを設定
    setTimeout(() => {
      navigator.onLine = true;
    }, 100);

    const result = await fetchWithRetry('https://example.com', {
      onOffline,
      onOnline,
      retryConfig: {
        maxRetries: 1,
        baseDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
      }
    });

    expect(result).toBe(mockResponse);
    expect(onOffline).toHaveBeenCalled();
  });
});

describe('NetworkStatusManager', () => {
  it('オンライン/オフライン状態の変化を監視する', () => {
    // NetworkStatusManagerは内部クラスなので、fetchWithRetryを通してテスト
    const onOffline = jest.fn();
    const onOnline = jest.fn();

    fetchWithRetry('https://example.com', {
      onOffline,
      onOnline
    });

    // イベントリスナーが登録されることを確認
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
