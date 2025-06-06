/**
 * 求人票デコーダー API
 * 求人票テキストを受け取り、AIを使用して解析し、結果を返すAPIルート
 */

export const runtime = 'edge';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  EnhancedAPIResponse,
  DecodingRequest,
  APIErrorResponse,
  EnhancedFinding,
  InterviewQuestions,
  FindingCategory,
  RiskLevel
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
// 短すぎるテキストは有効な解析が難しいため、最小長を設定
const MIN_TEXT_LENGTH = 20;

// 最大文字数制限（トークン制限対策）
const MAX_TEXT_LENGTH = 10000;

// リクエストタイムアウト（3分）
const REQUEST_TIMEOUT = 180000;

// プロンプトテンプレート（強化版）
const ENHANCED_PROMPT_TEMPLATE = `
あなたは経験豊富なキャリアアドバイザーで、求人票の裏にある本音を読み解く専門家です。
以下の求人票テキストを分析し、求職者が注意すべき表現や曖昧な記述を特定してください。

特に以下のカテゴリに注目して分析してください：
1. compensation: 給与・待遇に関する表現（例：「経験・能力に応じて」「インセンティブあり」）
2. worklife: 勤務時間や労働環境に関する表現（例：「繁忙期は残業あり」「フレックス勤務」）
3. culture: 職場環境や社風に関する表現（例：「アットホーム」「風通しの良い」）
4. growth: 成長機会やキャリアに関する表現（例：「成長できる環境」「スキルアップ支援」）
5. other: その他の注意すべき表現

各表現について、以下を提供してください：
1. 「本音の可能性」：その表現が示唆する可能性のある実態や裏事情を複数提示してください。ポジティブな可能性とネガティブな可能性の両方を含めてください。
2. 「確認すべきポイント」：面接や入社前に確認すべき具体的な質問やチェックポイントを提案してください。
3. 「重要度」：high（要注意）、medium（注意）、low（軽微）で分類してください。
4. 「カテゴリ」：上記5つのカテゴリのいずれかに分類してください。
5. 「確信度」：0.0-1.0の範囲でAIの確信度を示してください。
6. 「関連キーワード」：その表現に関連するキーワードを3-5個提示してください。
7. 「面接質問例」：面接で使える具体的な質問を2-3個提案してください。面接官にネガティブな印象を与えないように表現に注意してください。

分析にあたっては、以下の点に注意してください：
- 客観的かつ中立的な視点で分析し、企業を不当に買い被せるような断定的な表現は避けてください。
- 「本音の可能性」はあくまで可能性であり、確定的な事実として説明しないようにしてください。
- 各表現について、最低2つ以上の「本音の可能性」と「確認すべきポイント」を提供してください。
- 特に注意すべき表現が見つからない場合は、findings 配列を空にしてください。

求人票テキスト:
"""
{jobPostingText}
"""

以下のJSON形式で出力してください（必ず有効なJSON形式で出力してください）:

{
  "findings": [
    {
      "original_phrase": "アットホームな職場",
      "potential_realities": [
        "人間関係が非常に密で、プライベートな交流も多い可能性がある。",
        "チームワークや協調性が極めて重視され、個人での成果よりもチーム全体の調和が優先される文化かもしれない。"
      ],
      "points_to_check": [
        "具体的にどのような点がアットホームだと感じられるか、例を教えていただけますか？",
        "社内コミュニケーションや意思決定の方法についてもお聞かせください。"
      ],
      "severity": "medium",
      "category": "culture",
      "confidence": 0.85,
      "related_keywords": ["職場環境", "社風", "人間関係", "チームワーク"],
      "suggested_questions": [
        "チーム内での意見の相違があった場合、どのように解決されますか？",
        "個人の成果とチームの成果、どちらがより評価されますか？"
      ]
    }
  ],
  "summary": {
    "total_findings": 1,
    "risk_level": "medium",
    "categories_detected": ["culture"],
    "overall_recommendation": "この求人票には中程度の注意が必要な表現が含まれています。特に企業文化について詳しく確認することをお勧めします。"
  },
  "interview_questions": [
    {
      "category": "企業文化",
      "questions": [
        "アットホームな職場とは、具体的にどのような点を指していますか？",
        "社内でのコミュニケーションはどのような形で行われていますか？"
      ]
    }
  ],
  "metadata": {
    "analysis_timestamp": "${new Date().toISOString()}",
    "model_used": "gpt-4",
    "confidence_score": 0.85
  }
}

JSONのみを出力し、他の説明は不要です。
`;

/**
 * カテゴリ名の日本語マッピング
 */
const CATEGORY_LABELS: Record<FindingCategory, string> = {
  compensation: '給与・待遇',
  worklife: '労働環境',
  culture: '企業文化',
  growth: '成長機会',
  other: 'その他'
};

/**
 * エラー分類ユーティリティ
 */
class APIErrorClassifier {
  /**
   * エラーを分類してAPIエラーレスポンスを生成
   */
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
      retryAfter = 60; // 60秒後に再試行
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

  /**
   * HTTPステータスコードを取得
   */
  static getStatusCode(errorResponse: ExtendedAPIErrorResponse): number {
    switch (errorResponse.error_type) {
      case APIErrorType.VALIDATION_ERROR:
        return 400;
      case APIErrorType.RATE_LIMIT_ERROR:
        return 429;
      case APIErrorType.AUTHENTICATION_ERROR:
        return 500; // 内部エラーとして扱う
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
        // ストリーミングレスポンスではないことを確認
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
 * 全体的なリスクレベルを計算する関数
 */
function calculateOverallRisk(findings: EnhancedFinding[]): RiskLevel {
  if (findings.length === 0) return 'low';

  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;

  if (highCount > 0 || (mediumCount >= 3)) return 'high';
  if (mediumCount > 0) return 'medium';
  return 'low';
}

/**
 * 総合的な推奨事項を生成する関数
 */
function generateRecommendation(findings: EnhancedFinding[], riskLevel: RiskLevel): string {
  if (findings.length === 0) {
    return 'この求人票には特に注意すべき表現は見つかりませんでした。一般的な確認事項について面接で質問することをお勧めします。';
  }

  const categories = [...new Set(findings.map(f => f.category))];
  const categoryLabels = categories.map(c => CATEGORY_LABELS[c]).join('、');

  switch (riskLevel) {
    case 'high':
      return `この求人票には高い注意が必要な表現が含まれています。特に${categoryLabels}について詳しく確認し、慎重に検討することを強くお勧めします。`;
    case 'medium':
      return `この求人票には中程度の注意が必要な表現が含まれています。特に${categoryLabels}について詳しく確認することをお勧めします。`;
    case 'low':
      return `この求人票には軽微な注意点が含まれています。${categoryLabels}について確認しておくと良いでしょう。`;
  }
}

/**
 * カテゴリ別の質問を生成する関数
 */
function generateInterviewQuestions(findings: EnhancedFinding[]): InterviewQuestions[] {
  const questionsByCategory: Record<string, Set<string>> = {};

  findings.forEach(finding => {
    const categoryLabel = CATEGORY_LABELS[finding.category];
    if (!questionsByCategory[categoryLabel]) {
      questionsByCategory[categoryLabel] = new Set();
    }

    finding.suggested_questions.forEach(question => {
      questionsByCategory[categoryLabel].add(question);
    });
  });

  return Object.entries(questionsByCategory).map(([category, questionsSet]) => ({
    category,
    questions: Array.from(questionsSet)
  }));
}

/**
 * POSTハンドラー - 求人票テキストを受け取り、AIで解析し、結果を返す
 * @param {Request} request - 求人票テキストを含むPOSTリクエスト
 * @returns {Promise<NextResponse>} - 解析結果またはエラーメッセージを含むレスポンス
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
    const prompt = ENHANCED_PROMPT_TEMPLATE.replace('{jobPostingText}', body.text);

    // 5. LLM APIの呼び出し（タイムアウト付き）
    const response = await fetchWithTimeout(openai, {
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'あなたは経験豊富なキャリアアドバイザーです。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    // 6. レスポンスの取得とパース
    const content = response.choices[0]?.message.content;

    if (!content) {
      throw new Error('LLM APIからの応答が空です');
    }

    // 7. JSONとしてパースし、型定義を適用
    const llmResponse = JSON.parse(content) as EnhancedAPIResponse;

    // 8. レスポンスの後処理と検証
    const findings = llmResponse.findings || [];
    const riskLevel = calculateOverallRisk(findings);
    const categories = [...new Set(findings.map(f => f.category))];
    const recommendation = generateRecommendation(findings, riskLevel);
    const interviewQuestions = generateInterviewQuestions(findings);

    // 9. 強化されたレスポンスの構築
    const enhancedResponse: EnhancedAPIResponse = {
      findings,
      summary: {
        total_findings: findings.length,
        risk_level: riskLevel,
        categories_detected: categories,
        overall_recommendation: recommendation
      },
      interview_questions: interviewQuestions,
      metadata: {
        analysis_timestamp: new Date().toISOString(),
        model_used: process.env.MODEL_NAME || 'gpt-3.5-turbo',
        confidence_score: findings.length > 0
          ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
          : 0
      }
    };

    // 10. クライアントへのレスポンスを返す
    return NextResponse.json(enhancedResponse);

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
