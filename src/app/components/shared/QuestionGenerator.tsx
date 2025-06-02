/**
 * QuestionGeneratorコンポーネント
 * 面接質問の生成・管理・エクスポート機能を提供
 * カテゴリ別質問表示、チェックリスト機能、カスタマイズ機能を含む
 */
'use client';

import React, { useState, useEffect } from 'react';
// framer-motionは別の実装で必要になる可能性がある場合はコメント化
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
// Tabsコンポーネントは現在使用されていないためコメント化
import {
  MessageSquare,
  Plus,
  Download,
  Mail,
  Copy,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InterviewQuestions, EnhancedFinding } from '../../types/api';

/**
 * QuestionGeneratorコンポーネントのプロパティ
 */
interface QuestionGeneratorProps {
  /** 面接質問データ */
  interviewQuestions: InterviewQuestions[];
  /** 解析結果の詳細リスト */
  findings?: EnhancedFinding[];
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 質問項目の状態
 */
interface QuestionItem {
  id: string;
  category: string;
  question: string;
  isSelected: boolean;
  isCustom: boolean;
  isEditing?: boolean;
}

/**
 * カテゴリ設定
 */
const CATEGORY_CONFIG = {
  compensation: {
    label: '💰 給与・待遇',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400'
  },
  worklife: {
    label: '⏰ 労働環境',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
  },
  culture: {
    label: '🏢 企業文化',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400'
  },
  growth: {
    label: '📈 成長機会',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400'
  },
  other: {
    label: '📋 その他',
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400'
  }
} as const;

/**
 * 質問データを統一形式に変換
 */
function convertToQuestionItems(interviewQuestions: InterviewQuestions[]): QuestionItem[] {
  const items: QuestionItem[] = [];

  interviewQuestions.forEach(categoryData => {
    categoryData.questions.forEach((question, index) => {
      items.push({
        id: `${categoryData.category}-${index}`,
        category: categoryData.category,
        question,
        isSelected: true, // デフォルトで選択状態
        isCustom: false
      });
    });
  });

  return items;
}

/**
 * ローカルストレージキー
 */
const STORAGE_KEYS = {
  QUESTIONS: 'job-decoder-questions',
  CUSTOM_QUESTIONS: 'job-decoder-custom-questions'
};

/**
 * 質問生成・管理コンポーネント
 */
export function QuestionGenerator({
  interviewQuestions,
  className = ''
}: QuestionGeneratorProps) {
  const [questionItems, setQuestionItems] = useState<QuestionItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // 初期化とローカルストレージからの復元
  useEffect(() => {
    const baseItems = convertToQuestionItems(interviewQuestions);

    // ローカルストレージから保存された状態を復元
    const savedQuestions = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const savedCustomQuestions = localStorage.getItem(STORAGE_KEYS.CUSTOM_QUESTIONS);

    let restoredItems = baseItems;

    if (savedQuestions) {
      try {
        const savedData = JSON.parse(savedQuestions) as QuestionItem[];
        restoredItems = baseItems.map(item => {
          const saved = savedData.find((s) => s.id === item.id);
          return saved ? { ...item, isSelected: saved.isSelected } : item;
        });
      } catch (error) {
        console.error('Failed to restore question selection:', error);
      }
    }

    if (savedCustomQuestions) {
      try {
        const customItems = JSON.parse(savedCustomQuestions);
        restoredItems = [...restoredItems, ...customItems];
      } catch (error) {
        console.error('Failed to restore custom questions:', error);
      }
    }

    setQuestionItems(restoredItems);

    // 全カテゴリを初期展開
    const categories = new Set(restoredItems.map(item => item.category));
    setExpandedCategories(categories);
  }, [interviewQuestions]);

  // 状態変更時にローカルストレージに保存
  useEffect(() => {
    if (questionItems.length > 0) {
      const baseQuestions = questionItems.filter(item => !item.isCustom);
      const customQuestions = questionItems.filter(item => item.isCustom);

      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(baseQuestions));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify(customQuestions));
    }
  }, [questionItems]);

  /**
   * 質問の選択状態を切り替え
   */
  const toggleQuestionSelection = (questionId: string) => {
    setQuestionItems(prev =>
      prev.map(item =>
        item.id === questionId
          ? { ...item, isSelected: !item.isSelected }
          : item
      )
    );
  };

  /**
   * カテゴリの展開状態を切り替え
   */
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  /**
   * カスタム質問の追加
   */
  const addCustomQuestion = () => {
    if (newQuestion.trim()) {
      const newItem: QuestionItem = {
        id: `custom-${Date.now()}`,
        category: selectedCategory,
        question: newQuestion.trim(),
        isSelected: true,
        isCustom: true
      };

      setQuestionItems(prev => [...prev, newItem]);
      setNewQuestion('');
      setIsAddingQuestion(false);
    }
  };

  /**
   * 質問の編集開始
   */
  const startEditingQuestion = (questionId: string, currentText: string) => {
    setEditingQuestionId(questionId);
    setEditingText(currentText);
  };

  /**
   * 質問の編集保存
   */
  const saveEditingQuestion = () => {
    if (editingQuestionId && editingText.trim()) {
      setQuestionItems(prev =>
        prev.map(item =>
          item.id === editingQuestionId
            ? { ...item, question: editingText.trim() }
            : item
        )
      );
    }
    setEditingQuestionId(null);
    setEditingText('');
  };

  /**
   * 質問の編集キャンセル
   */
  const cancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setEditingText('');
  };

  /**
   * カスタム質問の削除
   */
  const deleteCustomQuestion = (questionId: string) => {
    setQuestionItems(prev => prev.filter(item => item.id !== questionId));
  };

  /**
   * 全選択/全解除
   */
  const toggleAllQuestions = () => {
    const selectedCount = questionItems.filter(item => item.isSelected).length;
    const shouldSelectAll = selectedCount < questionItems.length;

    setQuestionItems(prev =>
      prev.map(item => ({ ...item, isSelected: shouldSelectAll }))
    );
  };

  /**
   * カテゴリ別の全選択/全解除
   */
  const toggleCategoryQuestions = (category: string) => {
    const categoryItems = questionItems.filter(item => item.category === category);
    const selectedCount = categoryItems.filter(item => item.isSelected).length;
    const shouldSelectAll = selectedCount < categoryItems.length;

    setQuestionItems(prev =>
      prev.map(item =>
        item.category === category
          ? { ...item, isSelected: shouldSelectAll }
          : item
      )
    );
  };

  /**
   * 選択された質問のエクスポート
   */
  const exportSelectedQuestions = () => {
    const selectedQuestions = questionItems.filter(item => item.isSelected);
    const groupedQuestions = selectedQuestions.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item.question);
      return acc;
    }, {} as Record<string, string[]>);

    let exportText = '# 面接質問リスト\n\n';

    Object.entries(groupedQuestions).forEach(([category, questions]) => {
      const categoryLabel = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category;
      exportText += `## ${categoryLabel}\n\n`;
      questions.forEach((question, index) => {
        exportText += `${index + 1}. ${question}\n`;
      });
      exportText += '\n';
    });

    return exportText;
  };

  /**
   * クリップボードにコピー
   */
  const copyToClipboard = async () => {
    const text = exportSelectedQuestions();
    try {
      await navigator.clipboard.writeText(text);
      // TODO: トースト通知を追加
      console.log('質問リストをクリップボードにコピーしました');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * ダウンロード
   */
  const downloadQuestions = () => {
    const text = exportSelectedQuestions();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `面接質問リスト_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * メール送信（基本実装）
   */
  const sendByEmail = () => {
    const text = exportSelectedQuestions();
    const subject = encodeURIComponent('面接質問リスト');
    const body = encodeURIComponent(text);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl);
  };

  // カテゴリ別にグループ化
  const groupedQuestions = questionItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, QuestionItem[]>);

  const selectedCount = questionItems.filter(item => item.isSelected).length;
  const totalCount = questionItems.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            面接質問ジェネレーター
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedCount}/{totalCount}件選択
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllQuestions}
            >
              {selectedCount === totalCount ? '全解除' : '全選択'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* エクスポート機能 */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              コピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQuestions}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              ダウンロード
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={sendByEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              メール送信
            </Button>
          </div>
        )}

        {/* カスタム質問追加 */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">カスタム質問を追加</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingQuestion(!isAddingQuestion)}
            >
              <Plus className="h-4 w-4 mr-1" />
              質問追加
            </Button>
          </div>

          {isAddingQuestion && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="質問内容を入力してください..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={addCustomQuestion}
                  disabled={!newQuestion.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  追加
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setNewQuestion('');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  キャンセル
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 質問リスト */}
        <div className="space-y-4">
          {Object.entries(groupedQuestions).map(([category, questions]) => {
            const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
            const isExpanded = expandedCategories.has(category);
            const selectedInCategory = questions.filter(q => q.isSelected).length;

            return (
              <div key={category} className="border rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCategoryExpansion(category)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={categoryConfig?.color || ''}>
                      {categoryConfig?.label || category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedInCategory}/{questions.length}件選択
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategoryQuestions(category);
                      }}
                    >
                      {selectedInCategory === questions.length ? '全解除' : '全選択'}
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-3">
                    {questions.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={item.isSelected}
                          onCheckedChange={() => toggleQuestionSelection(item.id)}
                          className="mt-1"
                        />

                        <div className="flex-1">
                          {editingQuestionId === item.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={saveEditingQuestion}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  保存
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditingQuestion}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  キャンセル
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm leading-relaxed">
                              {item.question}
                              {item.isCustom && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  カスタム
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingQuestion(item.id, item.question)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          {item.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomQuestion(item.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalCount === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>質問が見つかりませんでした。</p>
            <p className="text-sm">カスタム質問を追加してください。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
