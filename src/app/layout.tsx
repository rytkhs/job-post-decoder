/**
 * ルートレイアウトコンポーネント
 * アプリケーション全体のレイアウトを定義する
 * シンプルなツール用のレイアウト
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
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
  title: "ブラック求人チェッカー",
  description: "求人票の文章をAIで解析し、隠された意味を明らかにするツールです。",
  keywords: ["求人票", "AI解析", "転職", "ブラック求人", "ブラック企業"],
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.svg" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
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
