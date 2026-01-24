import { $ } from "bun";

console.log("🚀 Setting up Sentinel...\n");

// Check Docker
console.log("1. Checking Docker installation...");
try {
  await $`docker --version`;
  console.log("✅ Docker is installed\n");
} catch {
  console.error("❌ Docker is not installed. Please install Docker first.");
  process.exit(1);
}

// Check Docker daemon
console.log("2. Checking Docker daemon...");
try {
  await $`docker ps`;
  console.log("✅ Docker daemon is running\n");
} catch {
  console.error("❌ Docker daemon is not running. Please start Docker.");
  process.exit(1);
}

// Check .env file
console.log("3. Checking environment variables...");
const envExists = await Bun.file(".env").exists();
if (!envExists) {
  console.log("⚠️  .env file not found. Creating from .env.example...");
  await $`cp .env.example .env`;
  console.log("✅ .env file created. Please edit it with your values.\n");
} else {
  console.log("✅ .env file exists\n");
}


console.log("4. Building project...");
await $`bun run build`;
console.log("✅ Build successful\n");

console.log("✨ Setup complete! Next steps:");
console.log("   1. Edit .env with your configuration");
console.log("   2. Add GCP credentials");
console.log("   3. Run: bun run setup:gcp (to create PubSub resources)");
console.log("   4. Run: bun run dev (to start in development mode)");
