import type { NextConfig } from "next";

/**
 * Cloudflare PagesでのNext.js App Routerアプリケーションの設定
 */
const nextConfig: NextConfig = {
  // Cloudflare Pagesでの動作に必要な設定
  output: 'standalone',
  
  // エッジコンピューティングの設定
  experimental: {
    // Cloudflare Workersでのエッジコンピューティングを有効化
    serverActions: {
      bodySizeLimit: '2mb', // リクエストボディサイズの上限を設定
    },
  },
};

export default nextConfig;
