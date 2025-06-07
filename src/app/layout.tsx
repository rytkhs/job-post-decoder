/**
 * ルートレイアウトコンポーネント
 * アプリケーション全体のレイアウトを定義する
 * シンプルなツール用のレイアウト
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "./components/error/ErrorBoundary";

/**
 * Geist Sansフォントの設定
 * アプリケーション全体で使用するメインフォント
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS変数名
  subsets: ["latin"], // フォントのサブセット
  display: 'swap', // フォント表示の最適化
});

/**
 * Geist Monoフォントの設定
 * コードや特定の要素に使用する等幅フォント
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS変数名
  subsets: ["latin"], // フォントのサブセット
  display: 'swap', // フォント表示の最適化
});

/**
 * アプリケーションのメタデータ設定
 */
export const metadata: Metadata = {
  title: "求人票デコーダー",
  description: "求人票の文章をAIで解析し、隠された意味を明らかにするツールです。",
  keywords: ["求人票", "AI解析", "転職", "デコード"],
};

/**
 * ビューポートの設定
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * ルートレイアウトコンポーネント
 * すべてのページに共通のレイアウトを提供する
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - レイアウト内にレンダリングされる子コンポーネント
 * @returns {JSX.Element} - レンダリングされるレイアウト要素
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary level="critical">
          {/* メインコンテンツエリア */}
          <ErrorBoundary level="page">
            {children}
          </ErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
