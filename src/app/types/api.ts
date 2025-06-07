/**
 * API関連の型定義
 * 求人票デコーダーのAPIレスポンスとリクエストの型を定義
 * 辛口キャリアアドバイザー診断システム用
 */

/**
 * 危険度レベル
 */
export type DangerLevel = '🔴' | '🟡' | '🟢';

/**
 * フィードバックタイプ
 */
export type FeedbackType = 'helpful' | 'not-helpful';

/**
 * 辛口診断の個別項目
 */
export interface CriticalFinding {
  /** 問題のあるフレーズ */
  phrase: string;
  /** 危険度レベル */
  danger_level: DangerLevel;
  /** 辛口一言診断 */
  one_line_diagnosis: string;
  /** 企業がこの表現を使う裏の事情 */
  hidden_reality: string;
  /** 面接での角が立たない確認方法 */
  how_to_check: string;
  /** よくある事例・パターン */
  real_story: string;
}

/**
 * 辛口診断APIレスポンス
 */
export interface CriticalAnalysisResponse {
  /** 全体の診断結果 */
  overall_diagnosis: string;
  /** 個別の診断項目 */
  key_findings: CriticalFinding[];
  /** 面接戦略のアドバイス */
  interview_strategy: string;
  /** 総合的なレッドフラッグサマリー */
  red_flags_summary: string;
  /** 受けるべきか見送るべきかの判断指針 */
  recommendation: 'apply' | 'caution' | 'avoid';
  /** 危険度の統計 */
  danger_stats: {
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  };
}

/**
 * 求人票の表現カテゴリ
 */
export type FindingCategory = 'compensation' | 'worklife' | 'culture' | 'growth' | 'other';

/**
 * 重要度レベル
 */
export type SeverityLevel = 'high' | 'medium' | 'low';

/**
 * リスクレベル
 */
export type RiskLevel = 'high' | 'medium' | 'low';

/**
 * 基本的な解析結果項目（既存との互換性維持）
 */
export interface Finding {
  original_phrase: string;
  potential_realities: string[];
  points_to_check: string[];
}

/**
 * 強化された解析結果項目
 */
export interface EnhancedFinding extends Finding {
  /** 重要度レベル */
  severity: SeverityLevel;
  /** カテゴリ分類 */
  category: FindingCategory;
  /** AI の確信度 (0-1の範囲) */
  confidence: number;
  /** 関連キーワード */
  related_keywords: string[];
  /** 面接で使える質問例 */
  suggested_questions: string[];
}

/**
 * 解析サマリー情報
 */
export interface AnalysisSummary {
  /** 検出された表現の総数 */
  total_findings: number;
  /** 全体的なリスクレベル */
  risk_level: RiskLevel;
  /** 検出されたカテゴリ一覧 */
  categories_detected: FindingCategory[];
  /** 総合的な推奨事項 */
  overall_recommendation: string;
}

/**
 * カテゴリ別質問
 */
export interface InterviewQuestions {
  /** カテゴリ名 */
  category: string;
  /** 質問リスト */
  questions: string[];
}

/**
 * 分析メタデータ
 */
export interface AnalysisMetadata {
  /** 分析実行時刻 */
  analysis_timestamp: string;
  /** 使用されたモデル名 */
  model_used: string;
  /** 全体的な確信度スコア */
  confidence_score: number;
}

/**
 * 基本的なLLMレスポンス（既存との互換性維持）
 */
export interface LLMResponse {
  findings: Finding[];
}

/**
 * 強化されたAPIレスポンス
 */
export interface EnhancedAPIResponse {
  /** 基本的な解析結果 */
  findings: EnhancedFinding[];
  /** 全体的な分析サマリー */
  summary: AnalysisSummary;
  /** 生成された質問例 */
  interview_questions: InterviewQuestions[];
  /** メタデータ */
  metadata: AnalysisMetadata;
}

/**
 * APIリクエストの型定義
 */
export interface DecodingRequest {
  /** 解析対象の求人票テキスト */
  text: string;
}

/**
 * APIエラーレスポンス
 */
export interface APIErrorResponse {
  /** エラーメッセージ */
  error: string;
}

/**
 * フィードバックデータ
 */
export interface FeedbackData {
  /** 発見事項のID（インデックス） */
  findingId: string;
  /** フィードバックタイプ */
  feedback: FeedbackType;
  /** フィードバック送信時刻 */
  timestamp: string;
}

/**
 * ユーザー設定
 */
export interface UserPreferences {
  /** 表示するカテゴリフィルター */
  selectedCategories: FindingCategory[];
  /** 重要度フィルター */
  severityFilter: SeverityLevel[];
  /** テーマ設定 */
  theme: 'light' | 'dark' | 'system';
}

/**
 * 解析ステップ
 */
export type AnalysisStep = 'input' | 'analyzing' | 'results' | 'insights';

/**
 * 解析進捗情報
 */
export interface AnalysisProgress {
  /** 現在のステップ */
  currentStep: AnalysisStep;
  /** 進捗率 (0-100) */
  progress: number;
  /** 推定残り時間（秒） */
  estimatedTime: number;
  /** 現在のステップメッセージ */
  message: string;
}
