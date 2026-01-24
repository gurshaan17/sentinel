import { PubSub } from '@google-cloud/pubsub';

if (!process.env.GCP_PROJECT_ID || !process.env.PUBSUB_TOPIC_NAME) {
  throw new Error('Missing GCP_PROJECT_ID or PUBSUB_TOPIC_NAME');
}

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
});

try {
  const topic = pubsub.topic(process.env.PUBSUB_TOPIC_NAME);
  const messageId = await topic.publishMessage({
    json: { test: 'ping' },
  });

  console.log('✅ PubSub publish successful:', messageId);
} catch (error) {
  console.error('❌ PubSub publish failed:', error);
}
