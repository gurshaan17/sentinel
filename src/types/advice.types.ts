export type AdviceSeverity = 'info' | 'warning' | 'critical';

export interface Advice {
  id: string;
  title: string;
  explanation: string;
  recommendation?: string;
  severity: AdviceSeverity;
  confidence: number;
  source: {
    containerName?: string;
    containerId?: string;
  };
  timestamp: string;
}