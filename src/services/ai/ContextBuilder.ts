import type { ClassifiedLog, AIContext } from '../../types';

export class ContextBuilder {
  build(logs: ClassifiedLog[]): AIContext {
    const timestamps = logs.map(l => l.timestamp.getTime());

    return {
      containerName: logs[0]?.containerName,
      windowStart: new Date(Math.min(...timestamps)).toISOString(),
      windowEnd: new Date(Math.max(...timestamps)).toISOString(),
      recentLogs: logs,
    };
  }
}