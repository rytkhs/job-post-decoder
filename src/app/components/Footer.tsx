'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="w-full py-4 border-t mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          © {new Date().getFullYear()} 求人票デコーダー
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          免責事項: 本サービスの結果はAIによるものであり、あくまで参考情報です。最終的な判断はご自身で行ってください。
        </p>
      </div>
    </footer>
  );
}
