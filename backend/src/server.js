import dotenv from 'dotenv';
dotenv.config();

// Mark that child services are orchestrated by master server
process.env.CHILD_SERVICE = 'true';

import catalogApp from '../services/catalog-service/src/server.js';
import playlistApp from '../services/playlist-service/src/server.js';
import userApp from '../services/user-service/src/server.js';
import adminApp from '../services/admin-service/src/server.js';
import gatewayApp from '../services/api-gateway/src/gateway.js';

const CATALOG_PORT = parseInt(process.env.CATALOG_PORT || '5001', 10);
const PLAYLIST_PORT = parseInt(process.env.PLAYLIST_PORT || '5002', 10);
const USER_PORT = parseInt(process.env.USER_PORT || '5003', 10);
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '5004', 10);
const GATEWAY_PORT = parseInt(process.env.PORT || process.env.GATEWAY_PORT || '5000', 10);

const activeServers = [];

/**
 * Start a microservice safely, handling port in-use gracefully
 */
const startServiceSafely = (app, port, name) => {
  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`  ⚡ [Microservice: ${name}] Online on http://localhost:${port}`);
      activeServers.push(server);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`  ℹ️  [Microservice: ${name}] Port ${port} is already in use (connected to existing service instance).`);
      } else {
        console.error(`  ❌ [Microservice: ${name}] Failed to start on port ${port}:`, err.message);
      }
      resolve(null);
    });
  });
};

/**
 * Boot the complete CloudTune Microservices Mesh
 */
export const startMicroservicesMesh = async () => {
  console.log(`
  ==============================================================
  🎵  CloudTune Microservices Mesh Initializing...
  🛡️   Pattern: Database-per-Service (Isolated Databases)
  ==============================================================`);

  // Start all 4 domain microservices
  await startServiceSafely(catalogApp, CATALOG_PORT, 'Catalog Service');
  await startServiceSafely(playlistApp, PLAYLIST_PORT, 'Playlist Service');
  await startServiceSafely(userApp, USER_PORT, 'User Service');
  await startServiceSafely(adminApp, ADMIN_PORT, 'Admin Service');

  console.log(`  ==============================================================`);
};

export const stopMicroservicesMesh = async () => {
  for (const server of activeServers) {
    try {
      server.close();
    } catch {}
  }
};

// Start services automatically when loaded or executed
await startMicroservicesMesh();

// In non-test mode, start the API Gateway server
if (process.env.NODE_ENV !== 'test') {
  const gatewayServer = gatewayApp.listen(GATEWAY_PORT, '0.0.0.0', () => {
    console.log(`
  🌐  CloudTune API Gateway Online
  🚀  Gateway Public URL: http://localhost:${GATEWAY_PORT}
  🔗  Reverse Proxy Routing -> Ports ${CATALOG_PORT}, ${PLAYLIST_PORT}, ${USER_PORT}, ${ADMIN_PORT}
  📦  Database Isolation: Active (Separate DB files per service)
  ==============================================================
    `);
  });
  activeServers.push(gatewayServer);
}

// Graceful shutdown
const handleExit = () => {
  stopMicroservicesMesh();
  process.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Export API Gateway application as default
export default gatewayApp;
