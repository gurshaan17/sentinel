export type DecisionSource = 'rule' | 'ai' | 'system';

export interface ExplainWhy {
  reasons: string[];
  confidence?: number;
  signals?: Record<string, number | string>;
  source: DecisionSource;
}

export interface DecisionLog {
  decisionId: string;
  action: string;
  explainWhy: ExplainWhy;
  timestamp: string;
}