import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 5000;

// Service routing configuration
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:5001';
const PLAYLIST_SERVICE_URL = process.env.PLAYLIST_SERVICE_URL || 'http://localhost:5002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5003';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:5004';

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-User']
}));

// Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// Serve local static media assets directly from gateway with Range header support
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || 'uploads');
app.use('/uploads', express.static(uploadsDir));

/**
 * Universal Stream-Native Reverse Proxy Forwarder
 * Streams request body directly to downstream microservice and streams response back
 */
const forwardRequest = (targetBaseUrl) => {
  return (req, res) => {
    try {
      const targetUrl = new URL(req.originalUrl, targetBaseUrl);

      const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
          'x-forwarded-for': req.ip,
          'x-forwarded-proto': req.protocol,
          'x-gateway-proxy': 'CloudTune-API-Gateway'
        }
      };

      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error(`[API Gateway Error] Route ${req.originalUrl} -> ${targetBaseUrl}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            error: 'Bad Gateway: Microservice temporarily unreachable',
            targetService: targetBaseUrl,
            details: err.message
          });
        }
      });

      // Stream request body (JSON, URL-encoded, or Multipart file uploads) directly
      req.pipe(proxyReq);
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gateway forwarding exception', details: err.message });
      }
    }
  };
};

/**
 * Aggregated Distributed System Health Check
 * Queries all microservices in parallel and reports health of all nodes and isolated databases
 */
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const servicesToCheck = [
    { name: 'catalog-service', url: `${CATALOG_SERVICE_URL}/api/health`, required: true },
    { name: 'playlist-service', url: `${PLAYLIST_SERVICE_URL}/api/health`, required: true },
    { name: 'user-service', url: `${USER_SERVICE_URL}/api/health`, required: true },
    { name: 'admin-service', url: `${ADMIN_SERVICE_URL}/api/health`, required: true }
  ];

  const results = await Promise.allSettled(
    servicesToCheck.map(async (svc) => {
      const t0 = Date.now();
      const response = await fetch(svc.url, { signal: AbortSignal.timeout(3000) });
      const latencyMs = Date.now() - t0;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return {
        name: svc.name,
        status: 'healthy',
        latencyMs,
        port: data.port,
        database: data.database
      };
    })
  );

  const servicesStatus = {};
  let allHealthy = true;

  results.forEach((resItem, idx) => {
    const svcName = servicesToCheck[idx].name;
    if (resItem.status === 'fulfilled') {
      servicesStatus[svcName] = resItem.value;
    } else {
      servicesStatus[svcName] = {
        name: svcName,
        status: 'unreachable',
        error: resItem.reason?.message || 'Connection refused'
      };
      allHealthy = false;
    }
  });

  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    architecture: 'Google Cloud Platform Microservices Architecture',
    platform: 'Google Cloud Platform (Cloud Run Multi-Service)',
    isolationPattern: 'Database-per-Service (Isolated Databases)',
    gateway: {
      status: 'online',
      port: PORT,
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startTime
    },
    services: servicesStatus,
    timestamp: new Date().toISOString()
  });
});

// Route /api/songs/:id/like specifically to User Service
app.use('/api/songs/:id/like', forwardRequest(USER_SERVICE_URL));

// Route /api/songs*, /api/artists*, /api/albums* to Catalog Service
app.use('/api/songs', forwardRequest(CATALOG_SERVICE_URL));
app.use('/api/artists', forwardRequest(CATALOG_SERVICE_URL));
app.use('/api/albums', forwardRequest(CATALOG_SERVICE_URL));

// Route /api/playlists* to Playlist Service
app.use('/api/playlists', forwardRequest(PLAYLIST_SERVICE_URL));

// Route /api/users* to User Service
app.use('/api/users', forwardRequest(USER_SERVICE_URL));

// Route /api/admin* to Admin Service
app.use('/api/admin', forwardRequest(ADMIN_SERVICE_URL));

// Gateway root
app.get('/', (req, res) => {
  res.json({
    name: 'CloudTune API Gateway',
    version: '2.0.0',
    architecture: 'Microservices with Isolated Databases',
    gatewayPort: PORT,
    routes: {
      catalogService: `${CATALOG_SERVICE_URL} (/api/songs, /api/artists, /api/albums)`,
      playlistService: `${PLAYLIST_SERVICE_URL} (/api/playlists)`,
      userService: `${USER_SERVICE_URL} (/api/users, /api/songs/:id/like)`,
      adminService: `${ADMIN_SERVICE_URL} (/api/admin)`
    },
    healthCheck: '/api/health'
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.CHILD_SERVICE) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ==============================================================
  🌐  CloudTune API Gateway Online
  🚀  Gateway Port: ${PORT}
  🔗  Catalog Service:  ${CATALOG_SERVICE_URL}
  🔗  Playlist Service: ${PLAYLIST_SERVICE_URL}
  🔗  User Service:     ${USER_SERVICE_URL}
  🔗  Admin Service:    ${ADMIN_SERVICE_URL}
  🛡️  Database-per-Service Isolated Databases Active
  ==============================================================
    `);
  });
}

export default app;
