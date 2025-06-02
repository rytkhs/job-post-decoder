/**
 * 求人票デコーダー API
 * 求人票テキストを受け取り、AIを使用して解析し、結果を返すAPIルート
 */

export const runtime = 'edge';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * 解析結果の各項目を表すインターフェース
 * @property {string} original_phrase - 求人票に記載されている元の表現
 * @property {string[]} potential_realities - その表現が示唆する可能性のある本音や実態
 * @property {string[]} points_to_check - 面接や入社前に確認すべきポイント
 */
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

/**
 * LLMからのレスポンスを表すインターフェース
 * @property {Finding[]} findings - 解析結果の配列
 */
interface LLMResponse {
  findings: Finding[];
}

/**
 * APIリクエストの型定義
 * @property {string} text - 解析対象の求人票テキスト
 */
interface DecodingRequest {
  text: string;
}

// 求人票テキストの最小文字数制限
// 短すぎるテキストは有効な解析が難しいため、最小長を設定
const MIN_TEXT_LENGTH = 20;

// プロンプトテンプレート
const PROMPT_TEMPLATE = `
あなたは経験豊富なキャリアアドバイザーで、求人票の裏にある本音を読み解く専門家です。
以下の求人票テキストを分析し、求職者が注意すべき表現や曖昧な記述を特定してください。

特に以下のカテゴリに注目して分析してください：
1. 勤務時間や労働環境に関する表現（例：「繁忙期は残業あり」「フレックス勤務」）
2. 待遇や報酬に関する表現（例：「経験・能力に応じて」「インセンティブあり」）
3. 職場環境や社風に関する表現（例：「アットホーム」「風通しの良い」）
4. 人物像や求めるスキルに関する表現（例：「チャレンジ精神」「柔軟な発想」）

各表現について、以下を提供してください：
1. 「本音の可能性」：その表現が示唆する可能性のある実態や裏事情を複数提示してください。ポジティブな可能性とネガティブな可能性の両方を含めてください。
2. 「確認すべきポイント」：面接や入社前に確認すべき具体的な質問やチェックポイントを提案してください。

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
      ]
    }
  ]
}

JSONのみを出力し、他の説明は不要です。
`;

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
      return NextResponse.json(
        { error: '求人票のテキストを入力してください。' },
        { status: 400 } // Bad Request
      );
    }
    
    // 最小文字数チェック - 短すぎるテキストは有効な解析が難しい
    if (body.text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `求人票のテキストは${MIN_TEXT_LENGTH}文字以上入力してください。` },
        { status: 400 } // Bad Request
      );
    }
    
    // 2. 環境変数からAIサービスのAPIキーを取得
    // OpenAIまたはOpenRouterのいずれかのAPIキーを使用
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    
    // APIキーが設定されていない場合はエラー
    if (!apiKey) {
      console.error('API key is not set in environment variables');
      return NextResponse.json(
        { error: 'サーバー設定エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 } // Internal Server Error
      );
    }
    
    // 3. OpenAI SDKクライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
      // OpenRouter使用時はカスタムベースURLを設定、それ以外はデフォルトのOpenAI URLを使用
      baseURL: process.env.OPENROUTER_BASE_URL || undefined,
    });
    
    // 4. プロンプトの生成 - テンプレートに求人票テキストを挿入
    const prompt = PROMPT_TEMPLATE.replace('{jobPostingText}', body.text);
    
    // 5. LLM APIの呼び出し
    const response = await openai.chat.completions.create({
      // 環境変数からモデル名を取得、未設定の場合はデフォルトでgpt-3.5-turboを使用
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      messages: [
        // システムメッセージでアシスタントの役割を設定
        { role: 'system', content: 'あなたは経験豊富なキャリアアドバイザーです。' },
        // ユーザーメッセージとしてプロンプトを送信
        { role: 'user', content: prompt }
      ],
      // temperatureパラメータ - 値が高いほど多様な出力になるが、一貫性が低下する可能性がある
      temperature: 0.7,
      // JSON形式での出力を強制
      response_format: { type: 'json_object' },
    });
    
    // 6. レスポンスの取得とパース
    const content = response.choices[0]?.message.content;
    
    // レスポンスが空の場合はエラー
    if (!content) {
      throw new Error('LLM APIからの応答が空です');
    }
    
    // 7. JSONとしてパースし、型定義を適用
    const llmResponse = JSON.parse(content) as LLMResponse;
    
    // 8. クライアントへのレスポンスを返す
    return NextResponse.json(llmResponse);
    
  } catch (error) {
    // エラー処理
    console.error('Error processing request:', error);
    
    // デフォルトのエラーメッセージ
    let errorMessage = 'サーバーでエラーが発生しました。時間をおいて再度お試しください。';
    
    // エラーの種類に応じたメッセージの生成
    if (error instanceof SyntaxError) {
      // JSONパースエラー
      errorMessage = 'LLMからの応答を解析できませんでした。';
    } else if (error instanceof Error) {
      // その他のエラーの詳細をログに記録
      // 本番環境では機密情報が含まれる可能性があるため注意が必要
      console.error(error.message);
    }
    
    // エラーレスポンスを返す
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 } // Internal Server Error
    );
  }
}
