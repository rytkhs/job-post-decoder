/**
 * 求人票辛口診断 API
 * 求人票テキストを受け取り、辛口キャリアアドバイザーの視点で解析し、結果を返すAPIルート
 */

export const runtime = 'edge';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  CriticalAnalysisResponse,
  DecodingRequest,
  APIErrorResponse
} from '../../types/api';

/**
 * APIエラーの種類
 */
enum APIErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 拡張されたAPIエラーレスポンス
 */
interface ExtendedAPIErrorResponse extends APIErrorResponse {
  error_type: APIErrorType;
  error_code: string;
  retry_after?: number;
  details?: string;
}

// 求人票テキストの最小文字数制限
const MIN_TEXT_LENGTH = 50;

// 最大文字数制限（トークン制限対策）
const MAX_TEXT_LENGTH = 5000;

// リクエストタイムアウト（3分）
const REQUEST_TIMEOUT = 180000;

// システムプロンプト（環境変数から取得、フォールバック用基本プロンプト付き）
const getSystemPrompt = (): string => {
  // 本番環境では詳細なプロンプトを環境変数から取得
  const envPrompt = process.env.CRITICAL_ADVISOR_SYSTEM_PROMPT;

  if (envPrompt) {
    return envPrompt;
  }

  // デバッグ用警告（開発環境でのみ表示）
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  CRITICAL_ADVISOR_SYSTEM_PROMPT environment variable not found. Using basic fallback prompt.');
  }

  // フォールバック用基本プロンプト
  return `
あなたは求人票を分析するAIアシスタントです。
求職者の視点に立って、求人票の内容を客観的に分析し、注意点や確認すべきポイントを提示してください。

求人票テキスト:
"""
{jobPostingText}
"""

以下のJSON形式で出力してください（必ず有効なJSON形式で出力してください）:

{
  "overall_diagnosis": "この求人票について総合的な所見",
  "key_findings": [
    {
      "phrase": "注目すべきフレーズ",
      "danger_level": "🟡",
      "one_line_diagnosis": "簡潔な診断",
      "hidden_reality": "考えられる背景",
      "how_to_check": "面接での確認方法",
      "real_story": "一般的によくある事例"
    }
  ],
  "interview_strategy": "面接での確認戦略",
  "red_flags_summary": "注意点のまとめ",
  "recommendation": "apply/caution/avoid",
  "danger_stats": {
    "high_risk_count": 0,
    "medium_risk_count": 0,
    "low_risk_count": 0
  }
}

危険度は 🔴（高危険）、🟡（要注意）、🟢（問題なし）で表現してください。
JSONのみを出力し、他の説明は不要です。
`;
};

/**
 * エラー分類ユーティリティ
 */
class APIErrorClassifier {
  static classifyError(error: Error | { status?: number; message?: string; name?: string }): ExtendedAPIErrorResponse {
    let errorType: APIErrorType;
    let errorCode: string;
    let message: string;
    let retryAfter: number | undefined;
    let details: string | undefined;

    const errorStatus = 'status' in error ? error.status : undefined;
    const errorMessage = error.message || '';
    const errorName = 'name' in error ? error.name : undefined;

    if (errorStatus === 429 || errorMessage.includes('rate limit')) {
      errorType = APIErrorType.RATE_LIMIT_ERROR;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = 'リクエスト制限に達しました。しばらく待ってから再試行してください。';
      retryAfter = 60;
    } else if (errorStatus === 401 || errorMessage.includes('authentication')) {
      errorType = APIErrorType.AUTHENTICATION_ERROR;
      errorCode = 'AUTHENTICATION_FAILED';
      message = 'API認証に失敗しました。管理者にお問い合わせください。';
    } else if ((errorStatus && errorStatus >= 500) || errorMessage.includes('server')) {
      errorType = APIErrorType.SERVER_ERROR;
      errorCode = 'EXTERNAL_SERVER_ERROR';
      message = 'AIサービスで問題が発生しています。しばらく待ってから再試行してください。';
      retryAfter = 30;
    } else if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
      errorType = APIErrorType.TIMEOUT_ERROR;
      errorCode = 'REQUEST_TIMEOUT';
      message = 'リクエストがタイムアウトしました。再試行してください。';
      retryAfter = 10;
    } else if (error instanceof SyntaxError || errorMessage.includes('JSON')) {
      errorType = APIErrorType.PARSING_ERROR;
      errorCode = 'RESPONSE_PARSING_ERROR';
      message = 'AIからの応答を解析できませんでした。再試行してください。';
      retryAfter = 5;
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      errorType = APIErrorType.NETWORK_ERROR;
      errorCode = 'NETWORK_CONNECTION_ERROR';
      message = 'ネットワーク接続に問題があります。接続を確認して再試行してください。';
      retryAfter = 15;
    } else {
      errorType = APIErrorType.UNKNOWN_ERROR;
      errorCode = 'UNKNOWN_ERROR';
      message = '予期しないエラーが発生しました。時間をおいて再度お試しください。';
      details = errorMessage;
    }

    const response: ExtendedAPIErrorResponse = {
      error: message,
      error_type: errorType,
      error_code: errorCode
    };

    if (retryAfter) {
      response.retry_after = retryAfter;
    }

    if (details) {
      response.details = details;
    }

    return response;
  }

  static getStatusCode(errorResponse: ExtendedAPIErrorResponse): number {
    switch (errorResponse.error_type) {
      case APIErrorType.VALIDATION_ERROR:
        return 400;
      case APIErrorType.RATE_LIMIT_ERROR:
        return 429;
      case APIErrorType.AUTHENTICATION_ERROR:
        return 500;
      case APIErrorType.TIMEOUT_ERROR:
        return 504;
      case APIErrorType.NETWORK_ERROR:
        return 503;
      case APIErrorType.SERVER_ERROR:
      case APIErrorType.PARSING_ERROR:
        return 502;
      default:
        return 500;
    }
  }
}

/**
 * タイムアウト付きのfetch関数
 */
async function fetchWithTimeout(
  openai: OpenAI,
  requestParams: OpenAI.Chat.Completions.ChatCompletionCreateParams,
  timeoutMs: number = REQUEST_TIMEOUT
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    openai.chat.completions.create(requestParams)
      .then(response => {
        clearTimeout(timeoutId);
        if ('choices' in response && Array.isArray(response.choices)) {
          resolve(response as OpenAI.Chat.Completions.ChatCompletion);
        } else {
          reject(new Error('Unexpected response format'));
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * POSTハンドラー - 求人票テキストを受け取り、辛口診断を実行し、結果を返す
 */
export async function POST(request: Request) {
  try {
    // 1. リクエストボディの取得とバリデーション
    const body = await request.json() as DecodingRequest;

    // 空のテキストチェック
    if (!body.text) {
      const errorResponse: ExtendedAPIErrorResponse = {
        error: '求人票のテキストを入力してください。',
        error_type: APIErrorType.VALIDATION_ERROR,
        error_code: 'MISSING_TEXT'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 最小文字数チェック
    if (body.text.length < MIN_TEXT_LENGTH) {
      const errorResponse: ExtendedAPIErrorResponse = {
        error: `求人票のテキストは${MIN_TEXT_LENGTH}文字以上入力してください。`,
        error_type: APIErrorType.VALIDATION_ERROR,
        error_code: 'TEXT_TOO_SHORT'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 最大文字数チェック
    if (body.text.length > MAX_TEXT_LENGTH) {
      const errorResponse: ExtendedAPIErrorResponse = {
        error: `求人票のテキストは${MAX_TEXT_LENGTH}文字以下で入力してください。`,
        error_type: APIErrorType.VALIDATION_ERROR,
        error_code: 'TEXT_TOO_LONG'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 2. 環境変数からAIサービスのAPIキーを取得
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('API key is not set in environment variables');
      const errorResponse: ExtendedAPIErrorResponse = {
        error: 'サーバー設定エラーが発生しました。管理者にお問い合わせください。',
        error_type: APIErrorType.AUTHENTICATION_ERROR,
        error_code: 'MISSING_API_KEY'
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // 3. OpenAI SDKクライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || undefined,
    });

    // 4. プロンプトの生成
    const prompt = getSystemPrompt().replace('{jobPostingText}', body.text);

    // 5. LLM APIの呼び出し（タイムアウト付き）
    const response = await fetchWithTimeout(openai, {
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    // 6. レスポンスの取得とパース
    const content = response.choices[0]?.message.content;

    if (!content) {
      throw new Error('LLM APIからの応答が空です');
    }

    // 7. JSONとしてパースし、型定義を適用
    const analysisResult = JSON.parse(content) as CriticalAnalysisResponse;

    // 8. レスポンスの検証と後処理
    if (!analysisResult.key_findings) {
      analysisResult.key_findings = [];
    }

    if (!analysisResult.danger_stats) {
      const findings = analysisResult.key_findings;
      analysisResult.danger_stats = {
        high_risk_count: findings.filter(f => f.danger_level === '🔴').length,
        medium_risk_count: findings.filter(f => f.danger_level === '🟡').length,
        low_risk_count: findings.filter(f => f.danger_level === '🟢').length,
      };
    }

    // 9. クライアントへのレスポンスを返す
    return NextResponse.json(analysisResult);

  } catch (error) {
    // エラー処理
    console.error('Error processing request:', error);

    // エラーを分類して適切なレスポンスを生成
    const errorResponse = APIErrorClassifier.classifyError(error as Error);
    const statusCode = APIErrorClassifier.getStatusCode(errorResponse);

    // Retry-Afterヘッダーを設定（該当する場合）
    const headers: Record<string, string> = {};
    if (errorResponse.retry_after) {
      headers['Retry-After'] = errorResponse.retry_after.toString();
    }

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers
    });
  }
}
