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

// 基本的なモック
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (fetch as jest.Mock).mockClear();
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
  it('基本的なエラー分類ができる', () => {
    const response = new Response('Internal Server Error', { status: 500 });
    const result = NetworkErrorClassifier.classifyError(null, response);

    expect(result.type).toBe(NetworkErrorType.SERVER_ERROR);
    expect(result.isRetryable).toBe(true);
  });
});

describe('DelayCalculator', () => {
  it('遅延時間を計算できる', () => {
    const result = DelayCalculator.calculateDelay(0, 1000, 10000, 2);
    expect(result).toBe(1000);
  });
});

describe('fetchWithTimeout', () => {
  it('正常なレスポンスを返す', async () => {
    const mockResponse = new Response('success');
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout('https://example.com');

    expect(result).toBe(mockResponse);
  });
});

describe('fetchWithRetry', () => {
  it('成功時は結果を返す', async () => {
    const mockResponse = new Response('success');
    (fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com');

    expect(result).toBe(mockResponse);
  });
});
