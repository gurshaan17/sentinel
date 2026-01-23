import { PubSub } from '@google-cloud/pubsub';

console.log("🔧 Setting up Google Cloud PubSub...\n");

const projectId = process.env.GCP_PROJECT_ID;
const topicName = process.env.PUBSUB_TOPIC_NAME || 'sentinel-logs';
const subscriptionName = process.env.PUBSUB_SUBSCRIPTION_NAME || 'sentinel-workers';
const credentialsPath = process.env.GCP_CREDENTIALS_PATH;

if (!projectId) {
  console.error("❌ GCP_PROJECT_ID not set in .env");
  process.exit(1);
}

const pubsub = new PubSub({
  projectId,
  keyFilename: credentialsPath,
});

try {
  // Create topic
  console.log(`Creating topic: ${topicName}...`);
  const [topic] = await pubsub.topic(topicName).get({ autoCreate: true });
  console.log(`✅ Topic created: ${topic.name}\n`);

  // Create subscription
  console.log(`Creating subscription: ${subscriptionName}...`);
  const [subscription] = await topic.subscription(subscriptionName).get({ autoCreate: true });
  console.log(`✅ Subscription created: ${subscription.name}\n`);

  console.log("✨ GCP PubSub setup complete!");
} catch (error) {
  console.error("❌ Failed to setup GCP:", error);
  process.exit(1);
}