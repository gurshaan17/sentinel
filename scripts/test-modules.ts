import { logger } from '../src/utils/logger';
import { RateLimiter } from '../src/middleware/rateLimiter';
// import { retry } from '../src/utils/retry';

// Test logger
logger.info('Testing logger...');
logger.debug('Debug message');
logger.warn('Warning message');
logger.error('Error message');

// Test rate limiter
const limiter = new RateLimiter(1000, 5);
console.log('\nTesting rate limiter:');
for (let i = 0; i < 10; i++) {
  const allowed = limiter.check('test-key');
  console.log(`Request ${i + 1}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`);
}

// Test retry
console.log('\nTesting retry logic:');
let attempts = 0;
const failTwice = async () => {
  attempts++;
  if (attempts < 3) throw new Error('Failed');
  return 'Success!';
};

// retry(failTwice, { maxAttempts: 5, delayMs: 100 })
//   .then(result => console.log('Retry result:', result))
//   .catch(err => console.error('Retry failed:', err));
