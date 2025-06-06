'use client';

/**
 * Footerコンポーネント
 * アプリケーションのフッター部分を表示するコンポーネント
 * 著作権表示、サービス情報、免責事項、リンクなどを美しく表示する
 */

import React from 'react';
import { Heart, Info, Github, Twitter, Mail, Shield, Sparkles, Brain, Target } from 'lucide-react';
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
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-gradient">求人票デコーダー</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AIが求人票の裏に隠された意味を解析し、より良い転職活動をサポートします。
              透明性のある採用プロセスの実現を目指しています。
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">作成</span>
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
              <span className="text-muted-foreground">で求職者を応援</span>
            </div>
          </motion.div>

          {/* 機能・特徴セクション */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              主な機能
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">AI解析</p>
                  <p className="text-xs text-muted-foreground">曖昧な表現の真意を推測</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">プライバシー保護</p>
                  <p className="text-xs text-muted-foreground">データは保存されません</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground/80">瞬時の結果</p>
                  <p className="text-xs text-muted-foreground">リアルタイムで解析</p>
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
              <span>© {currentYear} 求人票デコーダー</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs">すべての権利を保有</span>
            </div>

            {/* ソーシャルリンク（デモ用） */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <motion.a
                  href="#"
                  className="p-2 rounded-full bg-muted/50 hover:bg-primary/20 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </motion.a>
                <motion.a
                  href="#"
                  className="p-2 rounded-full bg-muted/50 hover:bg-primary/20 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </motion.a>
                <motion.a
                  href="#"
                  className="p-2 rounded-full bg-muted/50 hover:bg-primary/20 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Contact"
                >
                  <Mail className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 技術情報 */}
        <motion.div
          variants={itemVariants}
          className="text-center pt-4 border-t border-border/30 mt-6"
        >
          <p className="text-xs text-muted-foreground/70">
            Powered by Next.js • Tailwind CSS • OpenAI • Made with passion for job seekers
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
