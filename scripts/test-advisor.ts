import { AdvisoryPipeline } from '../src/pipelines/AdvisoryPipeline';
import { LogSeverity } from '../src/types';

const pipeline = new AdvisoryPipeline();

(async () => {
  await pipeline.process([
    {
      message: 'Memory usage: 95%',
      severity: LogSeverity.ERROR,
      containerId: 'abc',
      containerName: 'api',
      timestamp: new Date(),
      stream: 'stderr',
      patterns: [],
      metadata: {
        isError: true,
        requiresAction: true,
        tags: ['memory'],
      },
    },
  ]);
})();