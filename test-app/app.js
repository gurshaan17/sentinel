const http = require('http');

// Counter for different log types
let requestCount = 0;
let errorCount = 0;

// HTTP Server
const server = http.createServer((req, res) => {
  requestCount++;
  
  console.log(`[INFO] ${new Date().toISOString()} - Received ${req.method} ${req.url}`);
  
  // Simulate different responses
  if (req.url === '/error') {
    console.error(`[ERROR] ${new Date().toISOString()} - Database connection failed: Connection refused`);
    res.writeHead(500);
    res.end('Error');
  } else if (req.url === '/warning') {
    console.warn(`[WARNING] ${new Date().toISOString()} - Query execution took 5000ms - slow query detected`);
    res.writeHead(200);
    res.end('Warning logged');
  } else if (req.url === '/critical') {
    console.error(`[CRITICAL] ${new Date().toISOString()} - OutOfMemoryError: Java heap space exhausted`);
    res.writeHead(500);
    res.end('Critical error');
  } else {
    res.writeHead(200);
    res.end('OK');
  }
});

server.listen(3000, () => {
  console.log('[INFO] Server started and listening on port 3000');
});

// Generate periodic logs
setInterval(() => {
  const logTypes = [
    () => console.log(`[INFO] Application healthy - Uptime: ${process.uptime()}s`),
    () => console.log(`[DEBUG] Processing request #${requestCount}`),
    () => console.warn(`[WARNING] Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`),
  ];
  
  // Random log every 5 seconds
  const randomLog = logTypes[Math.floor(Math.random() * logTypes.length)];
  randomLog();
}, 5000);

// Simulate random errors every 30 seconds
setInterval(() => {
  const errors = [
    () => console.error('[ERROR] Connection timeout to external API'),
    () => console.error('[ERROR] Failed to parse JSON: Unexpected token'),
    () => console.error('[ERROR] Database deadlock detected'),
    () => console.warn('[WARNING] Cache miss - key not found'),
  ];
  
  const randomError = errors[Math.floor(Math.random() * errors.length)];
  randomError();
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[INFO] Server closed');
    process.exit(0);
  });
});