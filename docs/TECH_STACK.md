**技術スタック一覧: 求人票デコーダー (MVP)**

**1. フロントエンド**

*   **フレームワーク/ライブラリ:**
    *   **Next.js:** Reactベースのフレームワーク。App RouterまたはPages Routerを選択。
        *   理由: 開発効率、SSR/SSG対応、API Routes/Route Handlersによる簡易バックエンド機能、エコシステムの充実、Cloudflare Pagesとの相性の良さ。
*   **言語:**
    *   **TypeScript:** JavaScriptに静的型付けを追加。開発効率とコードの堅牢性向上。
        *   理由: 型安全によるバグの早期発見、コード補完の強化、大規模開発への対応力。Next.jsは標準でTypeScriptをサポート。
*   **UIコンポーネント/スタイリング:**
    *   **選択肢1 (推奨): Tailwind CSS**
        *   理由: ユーティリティファーストなCSSフレームワーク。迅速なUI構築、デザインの一貫性、カスタマイズの容易さ。Next.jsとの連携も容易。
    *   **選択肢2: CSS Modules / Styled Components / Emotion など**
        *   理由: コンポーネントスコープのCSS。慣れているものがあれば。
    *   **選択肢3: UIライブラリ (例: Shadcn/ui, Material UI, Chakra UIなど)**
        *   理由: 事前ビルドされた高品質なコンポーネント群。MVPではややオーバースペックかもしれないが、デザインに時間をかけたくない場合に有効。Shadcn/uiはTailwind CSSベースでカスタマイズ性が高い。
*   **状態管理 (小規模なためNext.js標準機能で十分な可能性):**
    *   **React Context API + `useState`, `useReducer`:** Next.jsの標準機能。MVPの範囲であればこれで十分対応可能。
    *   **Zustand / Jotai (オプション):** よりシンプルで軽量なグローバル状態管理ライブラリ。必要に応じて導入検討。

**2. バックエンド (Next.js API Routes / Route Handlers)**

*   **フレームワーク:** Next.js (API Routes / Route Handlers機能を利用)
*   **言語:** TypeScript (フロントエンドと共通)
*   **役割:**
    *   フロントエンドからのリクエスト受付。
    *   LLM APIキーの安全な管理（環境変数経由）。
    *   LLM APIへのプロキシ/リクエスト中継。
    *   入力バリデーション。
    *   レスポンス整形。

**3. LLM (大規模言語モデル)**

*   **APIプロバイダー (選択肢):**
    *   **OpenAI API (例: GPT-3.5-turbo, GPT-4):** 高性能で実績豊富。ドキュメントも充実。
    *   **Google Gemini API:** Googleの最新モデル。Vertex AI経由でも利用可能。
    *   **Anthropic Claude API:** 安全性や倫理面に配慮した設計。
    *   **その他 (Azure OpenAI Serviceなど):** 特定のクラウドプラットフォームとの親和性。
    *   理由: プロンプトエンジニアリングにより求人票の「翻訳・深読み」を実現。ルールベースやキーワードDBのメンテナンス負荷を軽減。
*   **連携方法:** 各プロバイダーが提供するSDK (Node.js/JavaScript用) または直接HTTPリクエスト。

**4. デプロイメント & ホスティング**

*   **プラットフォーム:**
    *   **Cloudflare Pages:** Next.jsアプリケーションのホスティングに最適化。
        *   理由: 無料枠が寛大、Git連携による自動デプロイ、グローバルCDN、カスタムドメイン対応、環境変数管理、Functions (サーバーレス関数) との連携も容易（将来的な拡張用）。
*   **CI/CD:** GitHub Actions (Cloudflare PagesがGitリポジトリと連携して自動ビルド・デプロイを提供)。

**5. 開発ツール・その他**

*   **バージョン管理:** Git / GitHub (またはGitLab, Bitbucket)
*   **パッケージマネージャー:** npm / yarn / pnpm
*   **コードエディタ:** Visual Studio Code (推奨)
*   **ブラウザ開発者ツール:** Chrome DevTools, Firefox Developer Toolsなど
*   **APIテストツール (オプション):** Postman, Insomnia, Thunder Client (VS Code拡張)
    *   理由: Next.jsのAPI Routes/Route HandlersやLLM APIの動作確認に便利。

**技術選定のポイント (再掲)**

*   **MVPファースト:** 迅速な開発と検証を最優先。
*   **開発者の習熟度:** Next.jsに慣れているという点を最大限に活かす。
*   **コスト効率:** Cloudflare PagesやLLM APIの無料枠/低価格帯を有効活用。
*   **シンプルさ:** 過度な複雑性を避け、コア機能の実装に集中。
*   **将来性:** ある程度の拡張性も考慮しつつ、まずはMVPの成功を目指す。
