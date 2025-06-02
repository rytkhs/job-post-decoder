# 求人票デコーダー

求人票デコーダーは、求人票の曖昧な表現や注意すべき箇所をAIが解析し、その裏にある可能性のある本音や確認すべきポイントを提示するWebアプリケーションです。

![求人票デコーダー](https://placehold.jp/3d4070/ffffff/800x400.png?text=求人票デコーダー)

## 概要

求人票には、「アットホームな職場」「チャレンジ精神のある方」「繁忙期は残業あり」など、曖昧な表現や解釈の余地がある記述が含まれていることがあります。求人票デコーダーは、そうした表現を分析し、求職者が面接前に確認すべきポイントや考慮すべき可能性を提示することで、より良い就職活動の意思決定をサポートします。

## 機能

- **求人票テキスト解析**: 入力された求人票テキストをAIが分析し、注意すべき表現を特定
- **本音の可能性の提示**: 各表現について、複数の解釈や裏にある可能性を提示
- **確認すべきポイントの提案**: 面接や入社前に確認すべき具体的な質問や確認事項を提案
- **レスポンシブデザイン**: スマートフォンからPCまで、様々なデバイスで快適に利用可能
- **ダークモード対応**: システムの設定に応じたカラーテーマを自動適用

## 使い方

1. テキストエリアに求人票のテキストを貼り付けます（例文挿入ボタンでサンプルテキストを試すこともできます）
2. 「デコード開始」ボタンをクリックします
3. AIが求人票を分析し、注意すべき表現とその解釈、確認すべきポイントを表示します
4. 結果を参考に、面接での質問事項や確認ポイントを検討します

## 技術スタック

- **フロントエンド**: [Next.js](https://nextjs.org) (App Router), [React](https://reactjs.org), [TypeScript](https://www.typescriptlang.org)
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com), [Shadcn/ui](https://ui.shadcn.com)
- **バックエンド**: Next.js API Routes
- **AI/LLM**: [OpenAI API](https://openai.com/api/) / [OpenRouter](https://openrouter.ai)
- **デプロイ**: [Cloudflare Pages](https://pages.cloudflare.com)

## 環境変数

アプリケーションを実行するには、以下の環境変数を `.env.local` ファイルに設定する必要があります：

```
# OpenAI APIキー（必須）
OPENAI_API_KEY=your_openai_api_key

# または、OpenRouter APIキー（OPENAI_API_KEYの代わりに使用可能）
# OPENROUTER_API_KEY=your_openrouter_api_key
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 使用するモデル名
# MODEL_NAME=model_name
```

## ローカル開発

```bash
# リポジトリのクローン
git clone https://github.com/rytkhs/job-post-decoder.git
cd job-post-decoder

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## デプロイ

このアプリケーションは、Cloudflare Pages、Vercel、Netlifyなどの静的サイトホスティングサービスに簡単にデプロイできます。

```bash
# 本番用ビルド
npm run build
```

## 免責事項

**重要**: 求人票デコーダーの解析結果はAIによるものであり、あくまで参考情報です。実際の求人票の内容や会社の状況は、直接確認することをお勧めします。AIの解釈は可能性の一つに過ぎず、必ずしも事実を反映しているわけではありません。最終的な判断はご自身で行ってください。

## ライセンス

MIT
