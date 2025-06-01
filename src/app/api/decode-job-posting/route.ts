import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 型定義
interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

interface LLMResponse {
  findings: Finding[];
}

// リクエストの型定義
interface DecodingRequest {
  text: string;
}

// 最小文字数の定義
const MIN_TEXT_LENGTH = 20;

// プロンプトテンプレート
const PROMPT_TEMPLATE = `
あなたは経験豊富なキャリアアドバイザーです。
以下の求人票テキストを分析し、曖昧な表現や注意すべき箇所を特定してください。
それぞれの箇所について、「本音の可能性」と「面接で確認すべきポイント」を提示してください。

客観的かつ中立的な視点で分析し、断定的な表現は避けてください。
複数の可能性を提示してください。
もし該当する表現が見つからない場合は、findings 配列を空にしてください。

求人票テキスト:
"""
{jobPostingText}
"""

以下のJSON形式で出力してください:

{
  "findings": [
    {
      "original_phrase": "アットホームな職場",
      "potential_realities": [
        "人間関係が非常に密で、プライベートな交流も多い可能性がある。",
        "チームワークや協調性が極めて重視され、個人での成果よりもチーム全体の調和が優先される文化かもしれない。"
      ],
      "points_to_check": [
        "具体的な社風やコミュニケーションの頻度について質問する。",
        "業務時間外の付き合いやイベント参加の任意性について確認する。"
      ]
    }
  ]
}

JSONのみを出力し、他の説明は不要です。
`;

export async function POST(request: Request) {
  try {
    // リクエストボディの取得とバリデーション
    const body = await request.json() as DecodingRequest;
    
    if (!body.text) {
      return NextResponse.json(
        { error: '求人票のテキストを入力してください。' },
        { status: 400 }
      );
    }
    
    if (body.text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `求人票のテキストは${MIN_TEXT_LENGTH}文字以上入力してください。` },
        { status: 400 }
      );
    }
    
    // 環境変数からAPIキーを取得
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('API key is not set in environment variables');
      return NextResponse.json(
        { error: 'サーバー設定エラーが発生しました。管理者にお問い合わせください。' },
        { status: 500 }
      );
    }
    
    // OpenAI クライアントの初期化
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || undefined, // OpenRouter使用時のみ設定
    });
    
    // プロンプトの生成
    const prompt = PROMPT_TEMPLATE.replace('{jobPostingText}', body.text);
    
    // LLM APIの呼び出し
    const response = await openai.chat.completions.create({
      model: process.env.MODEL_NAME || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'あなたは経験豊富なキャリアアドバイザーです。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    
    // レスポンスの取得とパース
    const content = response.choices[0]?.message.content;
    
    if (!content) {
      throw new Error('LLM APIからの応答が空です');
    }
    
    // JSONとしてパース
    const llmResponse = JSON.parse(content) as LLMResponse;
    
    // クライアントへのレスポンス
    return NextResponse.json(llmResponse);
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // エラーメッセージの生成
    let errorMessage = 'サーバーでエラーが発生しました。時間をおいて再度お試しください。';
    
    if (error instanceof SyntaxError) {
      errorMessage = 'LLMからの応答を解析できませんでした。';
    } else if (error instanceof Error) {
      // エラーの詳細をログに記録（本番環境では注意）
      console.error(error.message);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
