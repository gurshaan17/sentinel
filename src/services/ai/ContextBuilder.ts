import type { ClassifiedLog } from '../../types';
import type { AIContext } from '../../types/ai.types';

export class ContextBuilder {
  private readonly maxLogs = 20;

  build(logs: ClassifiedLog[]): AIContext {
    const slice = logs.slice(-this.maxLogs);

    return {
      containerId: slice[0]?.containerId ?? 'unknown',
      containerName: slice[0]?.containerName ?? 'unknown',
      recentLogs: slice,
      windowStart: slice[0]?.timestamp ?? new Date().toISOString(),
      windowEnd: slice.at(-1)?.timestamp ?? new Date().toISOString(),
    };
  }
}