'use client';

/**
 * Footerコンポーネント
 * アプリケーションのフッター部分を表示するコンポーネント
 * 著作権表示、サービス情報、免責事項、リンクなどを美しく表示する
 */

import React from 'react';
import { Info, Shield, Brain, Target, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * フッターコンポーネント
 * @returns {JSX.Element} - レンダリングされるフッターUI要素
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <footer className="relative w-full border-t border-border/50 bg-gradient-to-b from-background to-muted/20">
      {/* 装飾的な背景エフェクト */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {/* メインフッターコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* ブランドセクション */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">ブラック求人チェッカー</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              求職者をブラック企業から守るため、甘い言葉に隠された危険を見抜きます。
              転職失敗を防ぎ、より良いキャリア選択をサポートします。
            </p>
          </motion.div>

          {/* 機能・特徴セクション */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              分析について
            </h4>
                        <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">AI分析手法</p>
                  <p className="text-xs text-muted-foreground">LLMによる自然言語処理で表現を解析</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">判断基準</p>
                  <p className="text-xs text-muted-foreground">転職市場の一般的なパターンに基づく推測</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">重要な注意</p>
                  <p className="text-xs text-muted-foreground">結果は推測です。最終判断は面接で確認を</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 免責事項セクション */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <Info className="h-4 w-4 text-warning" />
              重要なお知らせ
            </h4>
            <div className="glass-effect rounded-lg p-4 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                本サービスの解析結果はAIによる<strong>推測</strong>であり、参考情報として提供されています。
                結果は可能性の一つに過ぎず、必ずしも事実を反映しているわけではありません。
                <br /><br />
                <strong className="text-foreground/80">実際の求人条件や会社状況は、必ず直接確認してください。</strong>
                最終的な判断はご自身の責任で行っていただくようお願いいたします。
              </p>
            </div>
          </motion.div>
        </div>

        {/* ソーシャルリンクと著作権 */}
        <motion.div variants={itemVariants} className="border-t border-border/50 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* 著作権情報 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>© {currentYear} ブラック求人チェッカー</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs">All Rights Reserved</span>
              {/* <span className="hidden sm:inline">•</span>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                🆓 現在無料提供中
              </span> */}
            </div>

          </div>
        </motion.div>

      </motion.div>
    </footer>
  );
}
