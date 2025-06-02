/**
 * ルートレイアウトコンポーネント
 * アプリケーション全体のレイアウトを定義し、共通のヘッダーとフッターを配置する
 * フォント、メタデータ、基本的なスタイルもここで設定する
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

/**
 * Geist Sansフォントの設定
 * アプリケーション全体で使用するメインフォント
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS変数名
  subsets: ["latin"], // フォントのサブセット
});

/**
 * Geist Monoフォントの設定
 * コードや特定の要素に使用する等幅フォント
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS変数名
  subsets: ["latin"], // フォントのサブセット
});

/**
 * アプリケーションのメタデータ設定
 * タイトルや説明文などのOGP情報を定義
 */
export const metadata: Metadata = {
  title: "求人票デコーダー",
  description: "求人票の曖昧な表現を解析し、本音の可能性や確認すべきポイントを提示します",
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
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {/* ヘッダーコンポーネント */}
        <Header />
        {/* メインコンテンツエリア - フレックスボックスで高さを調整 */}
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        {/* フッターコンポーネント */}
        <Footer />
      </body>
    </html>
  );
}
