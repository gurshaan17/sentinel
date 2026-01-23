import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

try {
  await docker.ping();
  console.log("✅ Docker connection successful");
  
  const containers = await docker.listContainers();
  console.log(`📦 Found ${containers.length} running containers`);
} catch (error) {
  console.error("❌ Docker connection failed:", error);
}
