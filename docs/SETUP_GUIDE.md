**開発環境構築手順書: 求人票デコーダー (MVP版)**

**前提条件**

*   Node.js と npm がインストールされていること。
    *   Node.js の推奨バージョン: LTS版 (例: v18.x, v20.x)
    *   確認方法: ターミナルで `node -v` および `npm -v` を実行。
*   Git がインストールされていること。
    *   確認方法: ターミナルで `git --version` を実行。
*   コードエディタ (例: Visual Studio Code) がインストールされていること。
*   LLM APIキーを取得済みであること (例: OpenAI APIキー)。
    *   OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

**1. プロジェクトのセットアップ (Next.js + TypeScript + Tailwind CSS)**

1.  **プロジェクトディレクトリの作成と移動:**
    ```bash
    mkdir job-post-decoder
    cd job-post-decoder
    ```

2.  **Next.jsプロジェクトの初期化:**
    ターミナルで以下のコマンドを実行し、対話形式で設定を進めます。
    ```bash
    npx create-next-app@latest . --typescript --eslint --tailwind --src-dir --app --use-npm
    ```
    *   `@latest`: 最新版の `create-next-app` を使用します。
    *   `.`: 現在のディレクトリ (`job-post-decoder`) にプロジェクトを作成します。
    *   `--typescript`: TypeScript を有効にします。
    *   `--eslint`: ESLint を有効にします。
    *   `--tailwind`: Tailwind CSS をセットアップします。
    *   `--src-dir`: `src/` ディレクトリを作成し、ソースコードをその中に配置します。
    *   `--app`: App Router を使用します (Pages Router を使用したい場合はこのオプションを外すか、対話で選択)。
    *   `--use-npm`: npm をパッケージマネージャーとして使用します (yarn を使いたい場合は `--use-yarn`)。

    対話式の質問例と推奨回答:
    *   `Would you like to use ESLint?` **Yes**
    *   `Would you like to use Tailwind CSS?` **Yes**
    *   `Would you like to use \`src/\` directory?` **Yes**
    *   `Would you like to use App Router? (recommended)` **Yes** (または好みに応じて No)
    *   `Would you like to customize the default import alias?` **No** (または好みに応じて Yes で設定)

3.  **必要なライブラリのインストール (任意):**
    LLM APIとの通信やUI構築に便利なライブラリをインストールします。
    ```bash
    npm install openai # OpenAI APIを利用する場合
    npm install axios # HTTPクライアント (fetchでも可)
    npm install lucide-react # アイコンライブラリ (任意)
    # その他、必要に応じて react-hot-toast (通知用) など
    ```
    *   `openai`: OpenAIの公式Node.jsライブラリ。
    *   `axios`: HTTPリクエストを行うためのライブラリ。Next.js標準の`fetch`でも問題ありません。
    *   `lucide-react`: シンプルで使いやすいアイコンライブラリ。お好みで。

**2. 環境変数の設定**

1.  **`.env.local` ファイルの作成:**
    プロジェクトのルートディレクトリ ( `package.json` と同じ階層) に `.env.local` という名前のファイルを作成します。
    このファイルは Git の管理対象外 ( `.gitignore` にデフォルトで記載されています) なので、APIキーなどの機密情報を安全に管理できます。

2.  **APIキーの設定:**
    `.env.local` ファイルに以下のようにLLM APIキーを記述します。
    ```env
    # 例: OpenAI APIキーの場合
    OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

    # 他のLLM APIを利用する場合は、そのAPIキーの変数名と値を設定
    # SOME_OTHER_LLM_API_KEY="your_other_api_key"
    ```
    **注意:** `"sk-xxxxxxxx..."` の部分は、実際に取得したご自身のAPIキーに置き換えてください。

**3. Gitリポジトリの初期化 (任意だが推奨)**

まだGitリポジトリを初期化していない場合は、プロジェクトのルートディレクトリで以下のコマンドを実行します。
```bash
git init
git add .
git commit -m "Initial commit: Setup Next.js project"
```
リモートリポジトリ (GitHubなど) を作成し、プッシュしておくと良いでしょう。

**4. VS Code の設定 (推奨)**

1.  **拡張機能のインストール:**
    VS Code を開いている場合、以下の拡張機能をインストールすると開発体験が向上します。
    *   `ESLint` (dbaeumer.vscode-eslint)
    *   `Prettier - Code formatter` (esbenp.prettier-vscode)
    *   `Tailwind CSS IntelliSense` (bradlc.vscode-tailwindcss)
    *   `DotENV` (mikestead.dotenv) - `.env` ファイルのシンタックスハイライト

2.  **フォーマッタの設定 (Prettier):**
    プロジェクトルートに `.prettierrc.json` ファイルを作成し、設定を記述します (例):
    ```json
    {
      "semi": true,
      "singleQuote": false,
      "tabWidth": 2,
      "trailingComma": "es5",
      "printWidth": 80
    }
    ```
    VS Code の設定で、保存時に自動フォーマットするよう設定しておくと便利です。
    `settings.json` に以下を追加:
    ```json
    {
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
    ```

**5. 開発サーバーの起動と動作確認**

1.  **開発サーバーの起動:**
    ターミナルで以下のコマンドを実行します。
    ```bash
    npm run dev
    ```

2.  **ブラウザで確認:**
    ターミナルに表示されたURL (通常は `http://localhost:3000`) をブラウザで開きます。
    Next.jsのデフォルトページが表示されれば、基本的なセットアップは完了です。

**6. 簡単なAPI Route/Route Handlerの作成とLLM連携テスト (推奨)**

環境変数が正しく読み込めているか、LLM APIとの基本的な通信ができるかを確認します。

1.  **API Route/Route Handlerの作成:**
    `src/app/api/hello-llm/route.ts` (App Routerの場合) または `src/pages/api/hello-llm.ts` (Pages Routerの場合) を作成します。

    **App Router (`src/app/api/hello-llm/route.ts`):**
    ```typescript
    import { NextResponse } from 'next/server';
    import OpenAI from 'openai';

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    export async function GET(request: Request) {
      try {
        // 簡単なテストプロンプト
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo", // または利用したいモデル
          messages: [{ role: "user", content: "日本の首都はどこですか？一言で答えてください。" }],
        });

        const answer = completion.choices[0]?.message?.content;
        return NextResponse.json({ answer });

      } catch (error) {
        console.error("LLM API Error:", error);
        return NextResponse.json({ error: "LLM APIとの通信に失敗しました。" }, { status: 500 });
      }
    }
    ```

2.  **動作確認:**
    開発サーバーを起動した状態で、ブラウザで `http://localhost:3000/api/hello-llm` にアクセスします。
    LLMからの応答 (例: `{"answer":"東京です。"}`) がJSON形式で表示されれば、APIキーの読み込みとLLM APIとの基本的な通信は成功です。エラーが出る場合は、APIキーの設定やコードを確認してください。
