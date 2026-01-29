export type ActionType =
  | 'restart_container'
  | 'scale_container'
  | 'throttle_logs'
  | 'mark_degraded'
  | 'noop';

export interface ActionProposal {
  action: ActionType;
  target: string;
  reason: string;
  confidence: number;
  params?: Record<string, unknown>;
}

export interface ExecutedAction {
  proposal: ActionProposal;
  executed: boolean;
  skippedReason?: string;
  timestamp: Date;
}