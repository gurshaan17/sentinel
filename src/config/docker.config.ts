export const dockerConfig = {
    socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    host: process.env.DOCKER_HOST,
    port: process.env.DOCKER_PORT ? parseInt(process.env.DOCKER_PORT) : undefined,
    reconnectInterval: parseInt(process.env.DOCKER_RECONNECT_INTERVAL || '5000'),
    maxReconnectAttempts: parseInt(process.env.DOCKER_MAX_RECONNECT_ATTEMPTS || '10'),
    connectionTimeout: parseInt(process.env.DOCKER_TIMEOUT || '30000'),
  } as const;
  