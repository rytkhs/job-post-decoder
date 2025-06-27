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
  CONTENT_VALIDATION_ERROR = 'CONTENT_VALIDATION_ERROR',
  PARTIAL_RESPONSE_ERROR = 'PARTIAL_RESPONSE_ERROR',
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
  partial_data?: Partial<CriticalAnalysisResponse>;
  recovery_suggestions?: string[];
}

// 求人票テキストの最小文字数制限
const MIN_TEXT_LENGTH = 50;

// 最大文字数制限（トークン制限対策）
const MAX_TEXT_LENGTH = 5000;

// リクエストタイムアウト（3分）
const REQUEST_TIMEOUT = 180000;

// JSONパースのリトライ回数（将来の拡張用）
// const MAX_PARSE_RETRIES = 3;

/**
 * 安全なJSONパース関数
 * 様々なエラーパターンに対応し、部分的な回復機能を提供
 */
class SafeJSONParser {
  /**
   * メインのパース関数
   */
  static parseResponseContent(content: string): {
    success: boolean;
    data?: CriticalAnalysisResponse;
    error?: string;
    partialData?: Partial<CriticalAnalysisResponse>;
    errorType?: APIErrorType;
    details?: string;
    recoverySuggestions?: string[];
  } {
    if (!content || content.trim() === '') {
      return {
        success: false,
        error: 'LLMからの応答が空です',
        errorType: APIErrorType.PARSING_ERROR,
        details: 'Response content is empty or null',
        recoverySuggestions: ['リクエストを再試行してください', '入力テキストを変更してみてください']
      };
    }

    // 1. 基本的なJSONパースを試行
    const basicParseResult = this.tryBasicParse(content);
    if (basicParseResult.success) {
      return basicParseResult;
    }

    // 2. JSON修復を試行
    const repairResult = this.tryRepairAndParse(content);
    if (repairResult.success) {
      return repairResult;
    }

    // 3. 部分的なデータ抽出を試行
    const partialResult = this.tryPartialExtraction(content);
    if (partialResult.partialData) {
      return {
        success: false,
        error: 'JSONが不完全ですが、部分的なデータを抽出しました',
        errorType: APIErrorType.PARTIAL_RESPONSE_ERROR,
        partialData: partialResult.partialData,
        details: partialResult.details,
        recoverySuggestions: [
          '部分的な結果を確認し、必要に応じて再試行してください',
          '入力テキストを短くして再度お試しください'
        ]
      };
    }

    // 4. すべて失敗した場合
    return {
      success: false,
      error: 'LLMからの応答を解析できませんでした',
      errorType: APIErrorType.PARSING_ERROR,
      details: basicParseResult.details || 'Unknown parsing error',
      recoverySuggestions: [
        'しばらく待ってから再試行してください',
        '入力テキストを変更してみてください',
        '管理者にお問い合わせください'
      ]
    };
  }

  /**
   * 基本的なJSONパースを試行
   */
  private static tryBasicParse(content: string) {
    try {
      const parsed = JSON.parse(content);
      const validated = this.validateAndNormalize(parsed);
      return {
        success: true,
        data: validated
      };
    } catch (error) {
      return {
        success: false,
        details: error instanceof Error ? error.message : 'Unknown JSON parse error'
      };
    }
  }

  /**
   * JSON修復を試行
   */
  private static tryRepairAndParse(content: string) {
    try {
      // 一般的なJSON修復パターンを適用
      let repairedContent = content;

      // 1. 先頭と末尾の不要な文字を除去
      repairedContent = repairedContent.trim();
      repairedContent = repairedContent.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');

      // 2. 末尾のカンマを修正
      repairedContent = repairedContent.replace(/,(\s*[}\]])/g, '$1');

      // 3. 不完全な文字列を修正
      repairedContent = repairedContent.replace(/"([^"]*)(\\*")([^",}]*)$/g, '"$1$2"');

      // 4. 不完全なオブジェクトを修正
      if (!repairedContent.endsWith('}') && repairedContent.includes('{')) {
        repairedContent += '}';
      }

      const parsed = JSON.parse(repairedContent);
      const validated = this.validateAndNormalize(parsed);

      return {
        success: true,
        data: validated
      };
    } catch (error) {
      return {
        success: false,
        details: `JSON repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 部分的なデータ抽出を試行
   */
  private static tryPartialExtraction(content: string) {
    const partialData: Partial<CriticalAnalysisResponse> = {};
    let extractedFields = 0;

    try {
      // overall_diagnosisの抽出
      const diagnosisMatch = content.match(/"overall_diagnosis"\s*:\s*"([^"]*)/);
      if (diagnosisMatch) {
        partialData.overall_diagnosis = diagnosisMatch[1];
        extractedFields++;
      }

      // key_findingsの抽出（簡易版）
      if (content.includes('"key_findings"')) {
        try {
          const findingsStart = content.indexOf('"key_findings"');
          const findingsContent = content.substring(findingsStart);
          const arrayMatch = findingsContent.match(/:\s*\[([\s\S]*?)\]/);
          if (arrayMatch) {
            partialData.key_findings = [];
            extractedFields++;
          }
                 } catch {
           // 無視
         }
      }

      // recommendationの抽出
      const recommendationMatch = content.match(/"recommendation"\s*:\s*"([^"]*)/);
      if (recommendationMatch) {
        partialData.recommendation = recommendationMatch[1] as 'apply' | 'caution' | 'avoid';
        extractedFields++;
      }

      return {
        partialData: extractedFields > 0 ? partialData : undefined,
        details: `Extracted ${extractedFields} fields from malformed JSON`
      };
    } catch (error) {
      return {
        partialData: undefined,
        details: `Partial extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * レスポンスの検証と正規化
   */
       private static validateAndNormalize(parsed: unknown): CriticalAnalysisResponse {
    const parsedObj = parsed as Record<string, unknown>;
    const result: CriticalAnalysisResponse = {
      overall_diagnosis: (typeof parsedObj.overall_diagnosis === 'string' ? parsedObj.overall_diagnosis : null) || '診断情報が不完全です',
      key_findings: Array.isArray(parsedObj.key_findings) ? parsedObj.key_findings : [],
      interview_strategy: (typeof parsedObj.interview_strategy === 'string' ? parsedObj.interview_strategy : null) || '面接戦略の情報が不完全です',
      red_flags_summary: (typeof parsedObj.red_flags_summary === 'string' ? parsedObj.red_flags_summary : null) || '注意点の情報が不完全です',
      recommendation: ['apply', 'caution', 'avoid'].includes(parsedObj.recommendation as string)
        ? parsedObj.recommendation as 'apply' | 'caution' | 'avoid'
        : 'caution',
      danger_stats: (parsedObj.danger_stats && typeof parsedObj.danger_stats === 'object')
        ? parsedObj.danger_stats as { high_risk_count: number; medium_risk_count: number; low_risk_count: number; }
        : {
            high_risk_count: 0,
            medium_risk_count: 0,
            low_risk_count: 0
          }
    };

    // key_findingsの各項目を検証
    result.key_findings = result.key_findings.map(finding => ({
      phrase: finding.phrase || '不明なフレーズ',
      danger_level: ['🔴', '🟡', '🟢'].includes(finding.danger_level)
        ? finding.danger_level
        : '🟡',
      one_line_diagnosis: finding.one_line_diagnosis || '診断情報が不完全です',
      hidden_reality: finding.hidden_reality || '背景情報が不完全です',
      how_to_check: finding.how_to_check || '確認方法が不完全です',
      real_story: finding.real_story || '事例情報が不完全です'
    }));

    // danger_statsの再計算
    const findings = result.key_findings;
    result.danger_stats = {
      high_risk_count: findings.filter(f => f.danger_level === '🔴').length,
      medium_risk_count: findings.filter(f => f.danger_level === '🟡').length,
      low_risk_count: findings.filter(f => f.danger_level === '🟢').length,
    };

    return result;
  }
}

/**
 * フォールバック用のダミーレスポンス生成
 */
function generateFallbackResponse(): CriticalAnalysisResponse {
  return {
    overall_diagnosis: "申し訳ございませんが、AIによる詳細な分析が完了できませんでした。手動での確認をお勧めします。",
    key_findings: [{
      phrase: "分析対象テキスト",
      danger_level: "🟡",
      one_line_diagnosis: "AI分析が不完全のため、詳細確認が必要です",
      hidden_reality: "技術的な問題により完全な分析ができませんでした",
      how_to_check: "面接で直接詳細を確認することをお勧めします",
      real_story: "システムの一時的な問題の可能性があります"
    }],
    interview_strategy: "AIの分析が不完全なため、より注意深く面接での確認を行ってください。",
    red_flags_summary: "システムの問題により完全な分析ができませんでした。慎重に判断してください。",
    recommendation: "caution",
    danger_stats: {
      high_risk_count: 0,
      medium_risk_count: 1,
      low_risk_count: 0
    }
  };
}

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
    let recoverySuggestions: string[] = [];

    const errorStatus = 'status' in error ? error.status : undefined;
    const errorMessage = error.message || '';
    const errorName = 'name' in error ? error.name : undefined;

    if (errorStatus === 429 || errorMessage.includes('rate limit')) {
      errorType = APIErrorType.RATE_LIMIT_ERROR;
      errorCode = 'RATE_LIMIT_EXCEEDED';
      message = 'リクエスト制限に達しました。しばらく待ってから再試行してください。';
      retryAfter = 60;
      recoverySuggestions = ['60秒待ってから再試行', 'アカウントの制限を確認'];
    } else if (errorStatus === 401 || errorMessage.includes('authentication')) {
      errorType = APIErrorType.AUTHENTICATION_ERROR;
      errorCode = 'AUTHENTICATION_FAILED';
      message = 'API認証に失敗しました。管理者にお問い合わせください。';
      recoverySuggestions = ['管理者にお問い合わせ', 'APIキーの設定を確認'];
    } else if ((errorStatus && errorStatus >= 500) || errorMessage.includes('server')) {
      errorType = APIErrorType.SERVER_ERROR;
      errorCode = 'EXTERNAL_SERVER_ERROR';
      message = 'AIサービスで問題が発生しています。しばらく待ってから再試行してください。';
      retryAfter = 30;
      recoverySuggestions = ['30秒待ってから再試行', 'サービス状況を確認'];
    } else if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
      errorType = APIErrorType.TIMEOUT_ERROR;
      errorCode = 'REQUEST_TIMEOUT';
      message = 'リクエストがタイムアウトしました。再試行してください。';
      retryAfter = 10;
      recoverySuggestions = ['10秒待ってから再試行', '入力テキストを短くする'];
    } else if (error instanceof SyntaxError || errorMessage.includes('JSON') || errorMessage.includes('parse')) {
      errorType = APIErrorType.PARSING_ERROR;
      errorCode = 'RESPONSE_PARSING_ERROR';
      message = 'AIからの応答を解析できませんでした。再試行してください。';
      retryAfter = 5;
      recoverySuggestions = ['5秒待ってから再試行', '入力内容を確認', '管理者にお問い合わせ'];
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      errorType = APIErrorType.NETWORK_ERROR;
      errorCode = 'NETWORK_CONNECTION_ERROR';
      message = 'ネットワーク接続に問題があります。接続を確認して再試行してください。';
      retryAfter = 15;
      recoverySuggestions = ['ネットワーク接続を確認', '15秒待ってから再試行'];
    } else {
      errorType = APIErrorType.UNKNOWN_ERROR;
      errorCode = 'UNKNOWN_ERROR';
      message = '予期しないエラーが発生しました。時間をおいて再度お試しください。';
      details = errorMessage;
      recoverySuggestions = ['しばらく待ってから再試行', '入力内容を確認', '管理者にお問い合わせ'];
    }

    const response: ExtendedAPIErrorResponse = {
      error: message,
      error_type: errorType,
      error_code: errorCode,
      recovery_suggestions: recoverySuggestions
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
      case APIErrorType.CONTENT_VALIDATION_ERROR:
        return 502;
      case APIErrorType.PARTIAL_RESPONSE_ERROR:
        return 206; // Partial Content
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
        error_code: 'MISSING_TEXT',
        recovery_suggestions: ['求人票のテキストを入力してください']
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 最小文字数チェック
    if (body.text.length < MIN_TEXT_LENGTH) {
      const errorResponse: ExtendedAPIErrorResponse = {
        error: `求人票のテキストは${MIN_TEXT_LENGTH}文字以上入力してください。`,
        error_type: APIErrorType.VALIDATION_ERROR,
        error_code: 'TEXT_TOO_SHORT',
        recovery_suggestions: [`${MIN_TEXT_LENGTH}文字以上のテキストを入力してください`]
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 最大文字数チェック
    if (body.text.length > MAX_TEXT_LENGTH) {
      const errorResponse: ExtendedAPIErrorResponse = {
        error: `求人票のテキストは${MAX_TEXT_LENGTH}文字以下で入力してください。`,
        error_type: APIErrorType.VALIDATION_ERROR,
        error_code: 'TEXT_TOO_LONG',
        recovery_suggestions: [`${MAX_TEXT_LENGTH}文字以下に短縮してください`]
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
        error_code: 'MISSING_API_KEY',
        recovery_suggestions: ['管理者にお問い合わせください']
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
      model: process.env.MODEL_NAME || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
      max_tokens: 10000,
    });

    // 6. レスポンスの取得とパース
    const content = response.choices[0]?.message.content;

    if (!content) {
      // フォールバック応答を生成
      console.warn('Empty LLM response, generating fallback');
      const fallbackResponse = generateFallbackResponse();
      return NextResponse.json(fallbackResponse, {
        headers: { 'X-Parse-Status': 'fallback' }
      });
    }

    // 7. 安全なJSONパースの実行
    const parseResult = SafeJSONParser.parseResponseContent(content);

    if (parseResult.success && parseResult.data) {
      // 正常にパースできた場合
      return NextResponse.json(parseResult.data);
    } else if (parseResult.partialData) {
      // 部分的なデータが取得できた場合
      const errorResponse: ExtendedAPIErrorResponse = {
        error: parseResult.error || 'データが不完全です',
        error_type: parseResult.errorType || APIErrorType.PARTIAL_RESPONSE_ERROR,
        error_code: 'PARTIAL_DATA_AVAILABLE',
        partial_data: parseResult.partialData,
        details: parseResult.details,
        recovery_suggestions: parseResult.recoverySuggestions || ['再試行してください']
      };

      return NextResponse.json(errorResponse, {
        status: 206, // Partial Content
        headers: { 'X-Parse-Status': 'partial' }
      });
    } else {
      // パースに完全に失敗した場合はフォールバック応答
      console.error('JSON parse failed completely, using fallback', {
        error: parseResult.error,
        details: parseResult.details,
        contentPreview: content.substring(0, 200)
      });

      const fallbackResponse = generateFallbackResponse();
      return NextResponse.json(fallbackResponse, {
        headers: { 'X-Parse-Status': 'fallback' }
      });
    }

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
