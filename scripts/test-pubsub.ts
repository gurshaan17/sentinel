import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_CREDENTIALS_PATH,
});

try {
  const [topics] = await pubsub.getTopics();
  console.log("✅ PubSub connection successful");
  console.log("Topics:", topics.map(t => t.name));
} catch (error) {
  console.error("❌ PubSub connection failed:", error);
}