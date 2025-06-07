/**
 * アプリケーション全体の状態管理ストア
 * Zustandを使用してグローバル状態を管理
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CriticalAnalysisResponse,
  // 後方互換性のため既存型も残す
  EnhancedAPIResponse,
  LLMResponse,
  FindingCategory,
  FeedbackType,
  AnalysisProgress
} from '../types/api';

/**
 * 解析結果の状態
 */
interface AnalysisState {
  /** 現在の解析結果 */
  currentResult: CriticalAnalysisResponse | EnhancedAPIResponse | LLMResponse | null;
  /** 原文テキスト */
  originalText: string | null;
  /** 解析履歴 */
  analysisHistory: Array<{
    id: string;
    timestamp: string;
    result: CriticalAnalysisResponse | EnhancedAPIResponse | LLMResponse;
    originalText: string;
    jobTitle?: string;
  }>;
  /** 解析進捗 */
  analysisProgress: AnalysisProgress | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー状態 */
  error: string | null;
}

/**
 * フィルター状態
 */
interface FilterState {
  /** 選択されたカテゴリ */
  selectedCategories: Set<FindingCategory>;
  /** 重要度フィルター */
  severityFilter: 'all' | 'high' | 'medium' | 'low';
  /** 検索クエリ */
  searchQuery: string;
}

/**
 * UI設定状態
 */
interface UIState {
  /** アクティブなタブ */
  activeTab: 'results' | 'questions' | 'interleave';
  /** アニメーション有効/無効 */
  enableAnimations: boolean;

  /** ダークモード */
  isDarkMode: boolean;
  /** コンパクト表示 */
  isCompactView: boolean;
}

/**
 * フィードバック状態
 */
interface FeedbackState {
  /** フィードバック履歴 */
  feedbackHistory: Record<string, FeedbackType>;
}

/**
 * 質問管理状態
 */
interface QuestionState {
  /** 選択された質問 */
  selectedQuestions: Record<string, boolean>;
  /** カスタム質問 */
  customQuestions: Array<{
    id: string;
    category: FindingCategory;
    question: string;
    timestamp: string;
  }>;
}

/**
 * アプリケーション全体の状態
 */
interface AppState extends AnalysisState, FilterState, UIState, FeedbackState, QuestionState {
  // 解析関連のアクション
  setAnalysisResult: (result: CriticalAnalysisResponse | EnhancedAPIResponse | LLMResponse | null) => void;
  setOriginalText: (text: string | null) => void;
  setAnalysisProgress: (progress: AnalysisProgress | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: CriticalAnalysisResponse | EnhancedAPIResponse | LLMResponse, originalText: string, jobTitle?: string) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;

  // フィルター関連のアクション
  setSelectedCategories: (categories: Set<FindingCategory>) => void;
  toggleCategory: (category: FindingCategory) => void;
  setSeverityFilter: (severity: 'all' | 'high' | 'medium' | 'low') => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // UI関連のアクション
  setActiveTab: (tab: 'results' | 'questions' | 'interleave') => void;
  toggleAnimations: () => void;

  toggleDarkMode: () => void;
  toggleCompactView: () => void;

  // フィードバック関連のアクション
  setFeedback: (findingId: string, feedback: FeedbackType) => void;
  clearFeedback: () => void;

  // 質問関連のアクション
  setQuestionSelection: (questionId: string, selected: boolean) => void;
  toggleAllQuestions: (selected: boolean) => void;
  addCustomQuestion: (category: FindingCategory, question: string) => void;
  removeCustomQuestion: (questionId: string) => void;
  updateCustomQuestion: (questionId: string, question: string) => void;

  // ユーティリティアクション
  resetState: () => void;
  exportState: () => string;
  importState: (state: string) => void;
}

/**
 * 初期状態
 */
const initialState = {
  // 解析状態
  currentResult: null,
  originalText: null,
  analysisHistory: [],
  analysisProgress: null,
  isLoading: false,
  error: null,

  // フィルター状態
  selectedCategories: new Set<FindingCategory>(),
  severityFilter: 'all' as const,
  searchQuery: '',

  // UI状態
  activeTab: 'interleave' as const,
  enableAnimations: true,

  isDarkMode: false,
  isCompactView: false,

  // フィードバック状態
  feedbackHistory: {},

  // 質問状態
  selectedQuestions: {},
  customQuestions: [],
};

/**
 * selectedCategoriesをSetに変換するヘルパー関数
 */
function ensureSetCategories(categories: Set<FindingCategory> | FindingCategory[] | unknown): Set<FindingCategory> {
  if (categories instanceof Set) {
    return categories;
  }
  if (Array.isArray(categories)) {
    return new Set(categories);
  }
  return new Set<FindingCategory>();
}

/**
 * アプリケーションストア
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 解析関連のアクション
      setAnalysisResult: (result) => set({ currentResult: result }),

      setOriginalText: (text) => set({ originalText: text }),

      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      addToHistory: (result, originalText, jobTitle) => {
        const id = `analysis-${Date.now()}`;
        const timestamp = new Date().toISOString();
        const historyItem = { id, timestamp, result, originalText, jobTitle };

        set((state) => ({
          analysisHistory: [historyItem, ...state.analysisHistory.slice(0, 9)] // 最大10件保持
        }));
      },

      clearHistory: () => set({ analysisHistory: [] }),

      removeFromHistory: (id) => set((state) => ({
        analysisHistory: state.analysisHistory.filter(item => item.id !== id)
      })),

      // フィルター関連のアクション
      setSelectedCategories: (categories) => set({ selectedCategories: ensureSetCategories(categories) }),

      toggleCategory: (category) => set((state) => {
        const currentCategories = ensureSetCategories(state.selectedCategories);
        const newCategories = new Set(currentCategories);
        if (newCategories.has(category)) {
          newCategories.delete(category);
        } else {
          newCategories.add(category);
        }
        return { selectedCategories: newCategories };
      }),

      setSeverityFilter: (severity) => set({ severityFilter: severity }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      clearFilters: () => set({
        selectedCategories: new Set(),
        severityFilter: 'all',
        searchQuery: ''
      }),

      // UI関連のアクション
      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleAnimations: () => set((state) => ({ enableAnimations: !state.enableAnimations })),



      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      toggleCompactView: () => set((state) => ({ isCompactView: !state.isCompactView })),

      // フィードバック関連のアクション
      setFeedback: (findingId, feedback) => set((state) => ({
        feedbackHistory: {
          ...state.feedbackHistory,
          [findingId]: feedback
        }
      })),

      clearFeedback: () => set({ feedbackHistory: {} }),

      // 質問関連のアクション
      setQuestionSelection: (questionId, selected) => set((state) => ({
        selectedQuestions: {
          ...state.selectedQuestions,
          [questionId]: selected
        }
      })),

      toggleAllQuestions: (selected) => set((state) => {
        const newSelections: Record<string, boolean> = {};
        Object.keys(state.selectedQuestions).forEach(id => {
          newSelections[id] = selected;
        });
        return { selectedQuestions: newSelections };
      }),

      addCustomQuestion: (category, question) => {
        const id = `custom-${Date.now()}`;
        const timestamp = new Date().toISOString();
        const customQuestion = { id, category, question, timestamp };

        set((state) => ({
          customQuestions: [...state.customQuestions, customQuestion]
        }));
      },

      removeCustomQuestion: (questionId) => set((state) => ({
        customQuestions: state.customQuestions.filter(q => q.id !== questionId)
      })),

      updateCustomQuestion: (questionId, question) => set((state) => ({
        customQuestions: state.customQuestions.map(q =>
          q.id === questionId ? { ...q, question } : q
        )
      })),

      // ユーティリティアクション
      resetState: () => set(initialState),

      exportState: () => {
        const state = get();
        return JSON.stringify({
          analysisHistory: state.analysisHistory,
          feedbackHistory: state.feedbackHistory,
          customQuestions: state.customQuestions,
          selectedQuestions: state.selectedQuestions,
          enableAnimations: state.enableAnimations,
          isDarkMode: state.isDarkMode,
          isCompactView: state.isCompactView
        });
      },

      importState: (stateString) => {
        try {
          const importedState = JSON.parse(stateString);
          set((state) => ({
            ...state,
            ...importedState,
            selectedCategories: ensureSetCategories(importedState.selectedCategories || [])
          }));
        } catch (error) {
          console.error('Failed to import state:', error);
        }
      }
    }),
    {
      name: 'job-decoder-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // 永続化するステートを選択
        return {
          enableAnimations: state.enableAnimations,

          isDarkMode: state.isDarkMode,
          isCompactView: state.isCompactView,
          activeTab: state.activeTab,
          // Set型を配列に変換して保存
          selectedCategories: Array.from(state.selectedCategories)
        };
      },
      // 復元時の処理
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating state:', error);
            return;
          }

          if (state) {
            // selectedCategoriesを適切にSetに変換
            state.selectedCategories = ensureSetCategories(state.selectedCategories);
          }
        };
      }
    }
  )
);

/**
 * 解析結果に関連するセレクター（一時的にコメントアウト - 辛口診断システム対応後に復活）
 */
// export const useAnalysisSelectors = () => {
//   const store = useAppStore();

//   return {
//     // 強化された解析結果を取得
//     getEnhancedFindings: (): EnhancedFinding[] => {
//       if (!store.currentResult?.findings) return [];

//       return store.currentResult.findings.map((finding) => {
//         // 既にEnhancedFindingの場合はそのまま返す
//         if ('severity' in finding && 'category' in finding) {
//           return finding as EnhancedFinding;
//         }

//         // 基本的なFindingの場合はデフォルト値で拡張
//         return {
//           ...finding,
//           severity: 'medium' as const,
//           category: 'other' as const,
//           confidence: 0.7,
//           related_keywords: [],
//           suggested_questions: []
//         };
//       });
//     },

//     // フィルタリングされた結果を取得
//     getFilteredFindings: (): EnhancedFinding[] => {
//       const storeState = useAppStore.getState();
//       const findings = storeState.currentResult?.findings ? storeState.currentResult.findings.map((finding: Finding | EnhancedFinding) => {
//         // 既にEnhancedFindingの場合はそのまま返す
//         if ('severity' in finding && 'category' in finding) {
//           return finding as EnhancedFinding;
//         }

//         // 基本的なFindingの場合はデフォルト値で拡張
//         return {
//           ...finding,
//           severity: 'medium' as const,
//           category: 'other' as const,
//           confidence: 0.7,
//           related_keywords: [],
//           suggested_questions: []
//         };
//       }) : [];

//       const selectedCategories = ensureSetCategories(storeState.selectedCategories);

//       return findings.filter(finding => {
//         // カテゴリフィルター
//         if (selectedCategories.size > 0 && !selectedCategories.has(finding.category)) {
//           return false;
//         }

//         // 重要度フィルター
//         if (storeState.severityFilter !== 'all' && finding.severity !== storeState.severityFilter) {
//           return false;
//         }

//         // 検索クエリフィルター
//         if (storeState.searchQuery) {
//           const query = storeState.searchQuery.toLowerCase();
//           return (
//             finding.original_phrase.toLowerCase().includes(query) ||
//             finding.potential_realities.some(reality => reality.toLowerCase().includes(query)) ||
//             finding.related_keywords?.some((keyword: string) =>
//               keyword.toLowerCase().includes(query)
//             )
//           );
//         }

//         return true;
//       });
//     },

//     // 統計情報を取得
//     getStatistics: () => {
//       const storeState = useAppStore.getState();
//       const findings = storeState.currentResult?.findings ? storeState.currentResult.findings.map((finding: Finding | EnhancedFinding) => {
//         // 既にEnhancedFindingの場合はそのまま返す
//         if ('severity' in finding && 'category' in finding) {
//           return finding as EnhancedFinding;
//         }

//         // 基本的なFindingの場合はデフォルト値で拡張
//         return {
//           ...finding,
//           severity: 'medium' as const,
//           category: 'other' as const,
//           confidence: 0.7,
//           related_keywords: [],
//           suggested_questions: []
//         };
//       }) : [];

//       const categoryStats = findings.reduce((acc, finding) => {
//         acc[finding.category] = (acc[finding.category] || 0) + 1;
//         return acc;
//       }, {} as Record<FindingCategory, number>);

//       const severityStats = findings.reduce((acc, finding) => {
//         acc[finding.severity] = (acc[finding.severity] || 0) + 1;
//         return acc;
//       }, {} as Record<string, number>);

//       return {
//         total: findings.length,
//         categoryStats,
//         severityStats
//       };
//     }
//   };
// };

/**
 * ストアの型エクスポート
 */
export type { AppState, AnalysisState, FilterState, UIState, FeedbackState, QuestionState };
