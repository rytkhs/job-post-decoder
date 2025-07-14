/**
 * ルートレイアウトコンポーネント
 * アプリケーション全体のレイアウトを定義する
 * シンプルなツール用のレイアウト
 */

import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL('https://black-checker.vercel.app'),

  title: {
    default: "ブラック求人チェッカー | AI求人票解析ツール",
    template: "%s | ブラック求人チェッカー",
  },
  description: "Protect Yourself from Bad Jobs.「アットホームな職場」「やりがいのある仕事」など、企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。",
  keywords: ["求人票", "AI解析", "転職", "ブラック求人", "ブラック企業", "求人チェック", "転職支援"],
  authors: [{ name: "ブラック求人チェッカー", url: "https://black-checker.vercel.app" }],
  creator: "ブラック求人チェッカー",
  publisher: "ブラック求人チェッカー",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://black-checker.vercel.app',
    siteName: 'ブラック求人チェッカー',
    title: 'ブラック求人チェッカー | AI求人票解析ツール',
    description: 'Protect Yourself from Bad Jobs. 企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。',
    images: [
      {
        url: '/ogp.png',
        width: 680,
        height: 680,
        alt: 'ブラック求人チェッカー | AI求人票解析ツール',
      },
    ],
  },
  twitter: {
    card: 'summary',
    site: '@tkhshkt',
    creator: '@tkhshkt',
    title: 'ブラック求人チェッカー | AI求人票解析ツール',
    description: 'Protect Yourself from Bad Jobs. 企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。',
    images: ['/ogp.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#ef4444',
      },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://black-checker.vercel.app',
  },
  verification: {
    google: 'b2oalEAL86dlbiGQtD8N9qZTqC9qrbgeFm96ZEN8jSw',
  },
  category: 'technology',
};

/**
 * ビューポートの設定
 */
export const viewport: Viewport = {
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
  // Google AnalyticsのトラッキングIDを環境変数から取得
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <ErrorBoundary level="critical">
          {/* メインコンテンツエリア */}
          <ErrorBoundary level="page">
            {children}
          </ErrorBoundary>
        </ErrorBoundary>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
