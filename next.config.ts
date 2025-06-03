import type { NextConfig } from "next";

/**
 * VercelでのNext.js App Routerアプリケーションの設定
 */
const nextConfig: NextConfig = {
  // Vercelでの最適な設定
  // outputはVercelが自動で処理するため削除

  // サーバーアクションの設定
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // リクエストボディサイズの上限を設定
    },
  },
};

export default nextConfig;
