'use client';

/**
 * Footerコンポーネント
 * アプリケーションのフッター部分を表示するコンポーネント
 * 著作権表示、サービスの目的、免責事項などの情報を表示する
 */

import React from 'react';
import { Heart, Info } from 'lucide-react';

/**
 * フッターコンポーネント
 * @returns {JSX.Element} - レンダリングされるフッターUI要素
 */
export function Footer() {
  return (
    <footer className="w-full py-6 border-t mt-auto bg-muted/30">
      <div className="container mx-auto px-4">
        {/* フッターコンテンツ - モバイルでは縦並び、デスクトップでは横並び */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* 著作権とサービス目的の表示 */}
          <div className="flex items-center space-x-1">
            {/* 著作権表示 - 現在の年を動的に表示 */}
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} 求人票デコーダー
            </p>
            {/* 区切り記号 */}
            <span className="text-muted-foreground">•</span>
            {/* サービス目的の表示 */}
            <p className="text-sm text-muted-foreground flex items-center">
              <span className="mr-1">作成</span>
              {/* ハートアイコン */}
              <Heart className="h-3 w-3 text-red-500 fill-red-500 inline-block" />
              <span className="ml-1">で求職者を応援</span>
            </p>
          </div>
          
          {/* 免責事項セクション */}
          <div className="flex items-start space-x-2">
            {/* 情報アイコン */}
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            {/* 免責事項テキスト */}
            <p className="text-xs text-muted-foreground text-left max-w-md">
              免責事項: 本サービスの解析結果はAIによるものであり、あくまで参考情報です。実際の求人票の内容や会社の状況は、直接確認することをお勧めします。最終的な判断はご自身で行ってください。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
