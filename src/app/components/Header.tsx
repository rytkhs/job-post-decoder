'use client';

/**
 * Headerコンポーネント
 * アプリケーションのヘッダー部分を表示するコンポーネント
 * アプリケーション名、説明、ダークモード切り替え、ナビゲーションを提供
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Moon, Sun, Menu, X, Zap } from 'lucide-react';
import { Button } from './ui/button';

/**
 * ヘッダーコンポーネント
 * @returns {JSX.Element} - レンダリングされるヘッダーUI要素
 */
export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ダークモードの初期化と変更検知
  useEffect(() => {
    // システムの設定またはローカルストレージから初期値を取得
    const stored = localStorage.getItem('darkMode');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = stored ? JSON.parse(stored) : systemPreference;

    setIsDarkMode(initialDarkMode);
    updateDarkMode(initialDarkMode);

    // システムの設定変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches);
        updateDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // スクロール位置の監視
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * ダークモードの切り替え
   */
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    updateDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  /**
   * ダークモードをドキュメントに適用
   */
  const updateDarkMode = (darkMode: boolean) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  /**
   * モバイルメニューの切り替え
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
          ${scrolled
            ? 'glass-effect shadow-lg backdrop-blur-md border-b border-border/50'
            : 'bg-transparent'
          }
        `}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ブランドロゴとタイトル */}
            <div className="flex items-center space-x-3 group">
              {/* アプリアイコン - アニメーション付きスパークルアイコン */}
              <div className="relative">
                <Sparkles
                  className="h-8 w-8 text-primary transition-all duration-300 group-hover:text-gradient-start group-hover:rotate-12"
                  aria-hidden="true"
                />
                <Zap
                  className="absolute -top-1 -right-1 h-4 w-4 text-warning opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"
                  aria-hidden="true"
                />
              </div>

              {/* アプリケーション名とキャッチフレーズ */}
              <div className="flex flex-col">
                <h1 className="text-2xl lg:text-3xl font-bold text-gradient leading-tight">
                  求人票デコーダー
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">
                  AI-Powered Job Analysis
                </p>
              </div>
            </div>

            {/* デスクトップナビゲーション */}
            <div className="hidden md:flex items-center space-x-4">
              {/* アプリの説明文 */}
              <div className="text-center max-w-md">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  求人票の裏にある本音を<br className="hidden lg:block"/>
                  <span className="text-primary font-semibold">AI</span>が解析します
                </p>
              </div>

              {/* ダークモード切り替えボタン */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="relative overflow-hidden group transition-all duration-300 hover:scale-110"
                aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                <Sun
                  className={`h-4 w-4 transition-all duration-300 ${
                    isDarkMode
                      ? 'rotate-90 scale-0 opacity-0'
                      : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                <Moon
                  className={`absolute h-4 w-4 transition-all duration-300 ${
                    isDarkMode
                      ? 'rotate-0 scale-100 opacity-100'
                      : '-rotate-90 scale-0 opacity-0'
                  }`}
                />
                <span className="sr-only">テーマを切り替え</span>
              </Button>
            </div>

            {/* モバイルメニューボタン */}
            <div className="md:hidden flex items-center space-x-2">
              {/* ダークモード切り替え（モバイル） */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="transition-all duration-300 hover:scale-110"
                aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                <Sun
                  className={`h-4 w-4 transition-all duration-300 ${
                    isDarkMode
                      ? 'rotate-90 scale-0 opacity-0'
                      : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                <Moon
                  className={`absolute h-4 w-4 transition-all duration-300 ${
                    isDarkMode
                      ? 'rotate-0 scale-100 opacity-100'
                      : '-rotate-90 scale-0 opacity-0'
                  }`}
                />
              </Button>

              {/* メニューボタン */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="transition-all duration-300"
                aria-label="メニューを開く"
                aria-expanded={isMenuOpen}
              >
                <Menu
                  className={`h-5 w-5 transition-all duration-300 ${
                    isMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
                <X
                  className={`absolute h-5 w-5 transition-all duration-300 ${
                    isMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* モバイルメニュー */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out
          ${isMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible'
          }
        `}
      >
        {/* オーバーレイ */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={toggleMenu}
          aria-hidden="true"
        />

        {/* モバイルメニューコンテンツ */}
        <div
          className={`
            absolute top-0 right-0 h-full w-80 max-w-[90vw] glass-effect border-l border-border
            transform transition-transform duration-300 ease-in-out
            ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="p-6 pt-20">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gradient">
                  求人票デコーダー
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  求人票の裏にある本音を<br/>
                  <span className="text-primary font-semibold">AI</span>が解析します
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  より良い転職活動をサポートします
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ヘッダーの高さを確保するためのスペーサー */}
      <div className="h-20" />
    </>
  );
}
