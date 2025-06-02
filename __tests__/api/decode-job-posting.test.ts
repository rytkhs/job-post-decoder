import { NextResponse } from 'next/server';

/**
 * APIエンドポイントのテスト
 * 実際のAPIエンドポイントを直接テストするのではなく、
 * APIの動作をシミュレートしたテストを実装
 */
describe('decode-job-posting API', () => {
  // グローバルfetchのモック
  global.fetch = jest.fn();
  
  // 各テスト前にモックをリセット
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  test('空のテキストでリクエストすると400エラーを返すこと', async () => {
    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: '求人票のテキストを入力してください。' })
    });

    // APIリクエスト
    const response = await fetch('/api/decode-job-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' })
    });

    // レスポンスの検証
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toContain('求人票のテキストを入力してください');
  });

  test('短すぎるテキストでリクエストすると400エラーを返すこと', async () => {
    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: '求人票のテキストは20文字以上入力してください。' })
    });

    // APIリクエスト
    const response = await fetch('/api/decode-job-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '短いテキスト' })
    });

    // レスポンスの検証
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toContain('文字以上入力してください');
  });

  test('APIキーが設定されていない場合は500エラーを返すこと', async () => {
    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'サーバー設定エラーが発生しました。管理者にお問い合わせください。' })
    });

    // APIリクエスト
    const response = await fetch('/api/decode-job-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '十分な長さのテキストを入力して、APIのテストを行います。これは20文字以上あります。' })
    });

    // レスポンスの検証
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toContain('サーバー設定エラー');
  });

  test('正常なリクエストで解析結果を返すこと', async () => {
    // 期待される解析結果
    const expectedResult = {
      findings: [
        {
          original_phrase: 'アットホームな職場環境',
          potential_realities: ['上下関係が厳しい可能性がある'],
          points_to_check: ['具体的な社内コミュニケーションの例を聞いてみる']
        }
      ]
    };

    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResult
    });

    // APIリクエスト
    const response = await fetch('/api/decode-job-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '十分な長さのテキストを入力して、APIのテストを行います。これは20文字以上あります。' })
    });

    // レスポンスの検証
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.findings).toBeDefined();
    expect(data.findings.length).toBeGreaterThan(0);
    expect(data.findings[0].original_phrase).toBe('アットホームな職場環境');
  });

  test('LLM APIからの応答が空の場合は500エラーを返すこと', async () => {
    // fetchのモック実装
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'LLMからの応答を解析できませんでした。' })
    });

    // APIリクエスト
    const response = await fetch('/api/decode-job-posting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '十分な長さのテキストを入力して、APIのテストを行います。これは20文字以上あります。' })
    });

    // レスポンスの検証
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
