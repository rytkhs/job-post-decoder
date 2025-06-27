import { POST } from '../../src/app/api/decode-job-posting/route';
import OpenAI from 'openai';

// OpenAIのモック
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// NextRequestのモック - Web APIのポリフィルを使用
const mockRequest = (body: Record<string, unknown>) => {
    return new Request('http://localhost:3000/api/decode-job-posting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
};

describe('decode-job-posting API', () => {
  const validRequestBody = {
    text: '求人募集です。アットホームな職場で、やりがいのある仕事をしませんか？少数精鋭のチームで、裁量権を持って働けます。'
  };

  let mockCreate: jest.Mock;

  beforeEach(() => {
    // 環境変数のモック
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    process.env.MODEL_NAME = 'test-model';

    // モックをクリア
    MockedOpenAI.mockClear();
    mockCreate = jest.fn();
    MockedOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as unknown as OpenAI));
  });

  // 既存のテストスイートはそのまま残す
  describe('Legacy Tests', () => {
    // グローバルfetchのモック
    global.fetch = jest.fn();

    // 各テスト前にモックをリセット
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

    test('空のテキストでリクエストすると400エラーを返すこと', async () => {
      const request = mockRequest({ text: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('求人票のテキストを入力してください');
    });

    test('LLM APIからの応答が空の場合は500エラーを返すこと', async () => {
        mockCreate.mockRejectedValue(new Error('LLM API Error'));

        const request = mockRequest(validRequestBody);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).not.toBe(200);
        expect(data.error).toBeDefined();
    });
  });

  test('正常なリクエストで成功レスポンスを返すこと', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            overall_diagnosis: "テスト診断",
            key_findings: [{
              phrase: "アットホームな職場",
              danger_level: "🟡",
              one_line_diagnosis: "要注意表現",
              hidden_reality: "残業が多い可能性",
              how_to_check: "面接で確認",
              real_story: "よくある話"
            }],
            interview_strategy: "テスト戦略",
            red_flags_summary: "テスト要約",
            recommendation: "caution",
            danger_stats: {
              high_risk_count: 0,
              medium_risk_count: 1,
              low_risk_count: 0
            }
          })
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.overall_diagnosis).toBe('テスト診断');
    expect(data.key_findings).toHaveLength(1);
  });

  test('不正なJSONレスポンスの場合にJSON修復を試行すること', async () => {
    // 末尾のカンマがある不正なJSON
    const malformedJson = `{
      "overall_diagnosis": "テスト診断",
      "key_findings": [{
        "phrase": "テストフレーズ",
        "danger_level": "🟡",
        "one_line_diagnosis": "テスト診断",
        "hidden_reality": "テスト背景",
        "how_to_check": "テスト確認",
        "real_story": "テスト事例",
      }],
      "interview_strategy": "テスト戦略",
      "red_flags_summary": "テスト要約",
      "recommendation": "caution",
      "danger_stats": {
        "high_risk_count": 0,
        "medium_risk_count": 1,
        "low_risk_count": 0,
      },
    }`;

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: malformedJson
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.overall_diagnosis).toBe('テスト診断');
  });

  test('不完全なJSONレスポンスの場合に部分的なデータを抽出すること', async () => {
    // 不完全なJSON（途中で切れている）
    const partialJson = `{
      "overall_diagnosis": "部分的な診断",
      "key_findings": [
      "interview_strategy": "部分的な戦略"`;

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: partialJson
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(206); // Partial Content

    const data = await response.json();
    expect(data.error_type).toBe('PARTIAL_RESPONSE_ERROR');
    expect(data.partial_data).toBeDefined();
    expect(data.partial_data.overall_diagnosis).toBe('部分的な診断');
  });

  test('完全にパースできないレスポンスの場合にフォールバック応答を返すこと', async () => {
    // 完全にパースできないレスポンス
    const invalidResponse = 'これは有効なJSONではありません。完全にパースできません。';

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: invalidResponse
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Parse-Status')).toBe('fallback');

    const data = await response.json();
    expect(data.overall_diagnosis).toContain('AIによる詳細な分析が完了できませんでした');
    expect(data.recommendation).toBe('caution');
  });

  test('空のLLMレスポンスの場合にフォールバック応答を返すこと', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: ''
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Parse-Status')).toBe('fallback');

    const data = await response.json();
    expect(data.overall_diagnosis).toContain('AIによる詳細な分析が完了できませんでした');
    expect(data.recommendation).toBe('caution');
  });

  test('不完全なデータ構造の場合に正規化されること', async () => {
    // 必須フィールドが欠けているJSON
    const incompleteJson = JSON.stringify({
      overall_diagnosis: "不完全な診断",
      // key_findingsが欠けている
      interview_strategy: "不完全な戦略"
      // 他の必須フィールドも欠けている
    });

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: incompleteJson
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(200); // 正常にパースされるため200

    const data = await response.json();
    expect(data.overall_diagnosis).toBe('不完全な診断');
    expect(data.key_findings).toEqual([]); // デフォルト値で正規化
    expect(data.recommendation).toBe('caution'); // デフォルト値
    expect(data.interview_strategy).toBe('不完全な戦略');
  });

  test('エラー分類とリカバリー提案が適切に設定されること', async () => {
    const partialJson = `{"overall_diagnosis": "部分的な診断"`;

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: partialJson
        }
      }]
    });

    const request = mockRequest(validRequestBody);
    const response = await POST(request);
    expect(response.status).toBe(206);

    const data = await response.json();
    expect(data.error_type).toBe('PARTIAL_RESPONSE_ERROR');
    expect(data.recovery_suggestions).toContain('部分的な結果を確認し、必要に応じて再試行してください');
    expect(data.recovery_suggestions).toContain('入力テキストを短くして再度お試しください');
  });
});
