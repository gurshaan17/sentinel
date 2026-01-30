import { ActionPipeline } from '../src/pipelines/ActionPipeline';
import type { Advice } from '../src/types';

console.log('⚙️ Starting Action Pipeline test...');

const pipeline = new ActionPipeline();

const advice: Advice = {
  id: 'test-1',
  title: 'Memory leak suspected',
  explanation: 'Heap memory keeps increasing without release',
  recommendation: 'Restart the container',
  severity: 'critical',
  confidence: 0.9,
  source: {
    containerName: 'api',
    containerId: 'abc123',
  },
  timestamp: new Date().toISOString(),
};

(async () => {
  await pipeline.handle(advice);
})();