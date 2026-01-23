import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_CREDENTIALS_PATH,
});

try {
    const topic = pubsub.topic(process.env.PUBSUB_TOPIC_NAME!);
    await topic.publishMessage({
      json: { test: 'ping' },
    });
    console.log("✅ PubSub connection successful");
} catch (error) {
    console.error("❌ PubSub connection failed:", error);
}