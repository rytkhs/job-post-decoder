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
  metadataBase: new URL('https://black-checker.vercel.app'),
  title: "ブラック求人チェッカー | AI求人票解析ツール",
  description: "求人票の甘い言葉に騙されるな！「アットホームな職場」「やりがいのある仕事」など、企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。",
  keywords: ["求人票", "AI解析", "転職", "ブラック求人", "ブラック企業", "求人チェック", "転職支援"],
  authors: [{ name: "ブラック求人チェッカー" }],
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
    description: '求人票の甘い言葉に騙されるな！企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。',
    images: [
      {
        url: '/apple-touch-icon.svg',
        width: 180,
        height: 180,
        alt: 'ブラック求人チェッカー',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tkhshkt',
    creator: '@tkhshtkh',
    title: 'ブラック求人チェッカー | AI求人票解析ツール',
    description: '求人票の甘い言葉に騙されるな！企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。',
    images: ['/apple-touch-icon.svg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.svg', color: '#ef4444' },
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
  // Google AnalyticsのトラッキングIDを環境変数から取得
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.svg" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ブラック求人チェッカー",
              "description": "求人票の甘い言葉に騙されるな！企業の巧妙な表現をAIで解析し、隠された意味を明らかにするツールです。",
              "url": "https://black-checker.vercel.app",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY"
              },
              "author": {
                "@type": "Organization",
                "name": "ブラック求人チェッカー"
              },
              "keywords": "求人票,AI解析,転職,ブラック求人,ブラック企業,求人チェック,転職支援",
              "inLanguage": "ja-JP"
            })
          }}
        />
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
        {/* Google Analytics 4 - 環境変数が設定されている場合のみ読み込み */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
