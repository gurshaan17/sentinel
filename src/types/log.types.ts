export enum LogSeverity {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
}
  
export interface RawLog {
    containerId: string;
    containerName: string;
    timestamp: Date;
    stream: 'stdout' | 'stderr';
    message: string;
}

export interface ParsedLog extends RawLog {
    level?: string;
    component?: string;
    structured?: Record<string, unknown>;
}
  
export interface ClassifiedLog extends ParsedLog {
    severity: LogSeverity;
    patterns: string[];
    metadata: {
      isError: boolean;
      requiresAction: boolean;
      tags: string[];
    };
}