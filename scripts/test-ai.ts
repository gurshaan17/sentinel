import { LogPipeline } from '../src/pipelines/LogPipeline';
import { LogSeverity, type ClassifiedLog } from '../src/types';

const pipeline = new LogPipeline();

const mockLogs: ClassifiedLog[] = [
  {
    message: 'Database connection timeout',
    severity: LogSeverity.ERROR,
    containerId: 'abc',
    containerName: 'api',
    timestamp: new Date(),
    stream: 'stdout',
    patterns: [],
    metadata: {
      isError: true,
      requiresAction: true,
      tags: ['database', 'timeout'],
    },
  },
  {
    message: 'Retrying query',
    severity: LogSeverity.WARNING,
    containerId: 'abc',
    containerName: 'api',
    timestamp: new Date(),
    stream: 'stdout',
    patterns: [],
    metadata: {
      isError: false,
      requiresAction: false,
      tags: ['retry'],
    },
  },
];

console.log('Starting AI test...');

(async () => {
  for (const log of mockLogs) {
    console.log('Ingesting log:', log.message);
    await pipeline.ingest(log);
  }
  console.log('AI test completed');
})();