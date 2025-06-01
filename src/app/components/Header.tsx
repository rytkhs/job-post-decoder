'use client';

/**
 * Headerコンポーネント
 * アプリケーションのヘッダー部分を表示するコンポーネント
 * アプリケーション名と簡単な説明文を表示する
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ヘッダーコンポーネント
 * @returns {JSX.Element} - レンダリングされるヘッダーUI要素
 */
export function Header() {
  return (
    <header className="w-full py-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* アプリケーション名とアイコン */}
          <div className="flex items-center space-x-2">
            {/* アプリアイコン - スパークルアイコン */}
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {/* アプリケーション名 - グラデーションテキストで表示 */}
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              求人票デコーダー
            </h1>
          </div>
          {/* アプリの説明文 - モバイル表示では非表示 */}
          <div className="hidden sm:block">
            <p className="text-sm text-muted-foreground">求人票の裏にある本音をAIが解析します</p>
          </div>
        </div>
      </div>
    </header>
  );
}
