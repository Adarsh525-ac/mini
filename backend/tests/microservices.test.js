/**
 * Dedicated Microservices & Database Isolation Automated Test Suite
 * Validates:
 * 1. Independent Microservice Execution & Endpoints
 * 2. Database-per-Service Pattern & Physical Database Isolation
 * 3. Cross-Service Inter-Service REST HTTP Communication
 * 4. API Gateway Aggregated Health & Routing
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/server.js');

const GATEWAY_PORT = 5098;
let server;

const assert = (condition, message, testResults) => {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testResults.passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testResults.failed++;
  }
};

const runMicroserviceTests = async () => {
  console.log('🔬 Starting CloudTune Microservices & Database Isolation Test Suite...\n');
  const results = { passed: 0, failed: 0 };

  const request = async (url, options = {}) => {
    try {
      const res = await fetch(url, options);
      let data = null;
      try { data = await res.json(); } catch {}
      return { status: res.status, data };
    } catch (e) {
      return { status: 0, error: e.message };
    }
  };

  try {
    // ------------------------------------------------------------------
    // TEST SUITE 1: Independent Microservice Health Checks
    // ------------------------------------------------------------------
    console.log('📌 Section 1: Independent Microservice Health & Endpoints');

    const catalogHealth = await request('http://localhost:5001/api/health');
    assert(catalogHealth.status === 200, 'Catalog Service (Port 5001) /api/health responds with 200', results);
    assert(catalogHealth.data?.service === 'catalog-service', 'Catalog Service identifies itself correctly', results);
    assert(Boolean(catalogHealth.data?.database?.name), 'Catalog Service reports its isolated database', results);

    const playlistHealth = await request('http://localhost:5002/api/health');
    assert(playlistHealth.status === 200, 'Playlist Service (Port 5002) /api/health responds with 200', results);
    assert(playlistHealth.data?.service === 'playlist-service', 'Playlist Service identifies itself correctly', results);

    const userHealth = await request('http://localhost:5003/api/health');
    assert(userHealth.status === 200, 'User Service (Port 5003) /api/health responds with 200', results);
    assert(userHealth.data?.service === 'user-service', 'User Service identifies itself correctly', results);

    const adminHealth = await request('http://localhost:5004/api/health');
    assert(adminHealth.status === 200, 'Admin Service (Port 5004) /api/health responds with 200', results);
    assert(adminHealth.data?.service === 'admin-service', 'Admin Service identifies itself correctly', results);

    // ------------------------------------------------------------------
    // TEST SUITE 2: Aggregated API Gateway Health
    // ------------------------------------------------------------------
    console.log('\n📌 Section 2: Aggregated API Gateway Health Check');
    const gatewayHealth = await request(`http://localhost:${GATEWAY_PORT}/api/health`);
    assert(gatewayHealth.status === 200, 'API Gateway /api/health responds with HTTP 200', results);
    assert(gatewayHealth.data?.architecture?.includes('Microservices'), 'Gateway reports Microservices architecture', results);
    assert(gatewayHealth.data?.services?.['catalog-service']?.status === 'healthy', 'Gateway reports Catalog Service healthy', results);
    assert(gatewayHealth.data?.services?.['playlist-service']?.status === 'healthy', 'Gateway reports Playlist Service healthy', results);
    assert(gatewayHealth.data?.services?.['user-service']?.status === 'healthy', 'Gateway reports User Service healthy', results);
    assert(gatewayHealth.data?.services?.['admin-service']?.status === 'healthy', 'Gateway reports Admin Service healthy', results);

    // ------------------------------------------------------------------
    // TEST SUITE 3: Physical Database Isolation (Database-per-Service)
    // ------------------------------------------------------------------
    console.log('\n📌 Section 3: Database Isolation (Database-per-Service Pattern)');

    const catalogDbPath = path.resolve(__dirname, '../services/catalog-service/data/catalog.db.json');
    const playlistDbPath = path.resolve(__dirname, '../services/playlist-service/data/playlists.db.json');
    const userDbPath = path.resolve(__dirname, '../services/user-service/data/users.db.json');
    const adminDbPath = path.resolve(__dirname, '../services/admin-service/data/admin.db.json');

    assert(fs.existsSync(catalogDbPath), 'Catalog isolated DB file exists on disk', results);
    assert(fs.existsSync(playlistDbPath), 'Playlist isolated DB file exists on disk', results);
    assert(fs.existsSync(userDbPath), 'User isolated DB file exists on disk', results);
    assert(fs.existsSync(adminDbPath), 'Admin isolated DB file exists on disk', results);

    const catalogRaw = JSON.parse(fs.readFileSync(catalogDbPath, 'utf8'));
    const playlistRaw = JSON.parse(fs.readFileSync(playlistDbPath, 'utf8'));
    const userRaw = JSON.parse(fs.readFileSync(userDbPath, 'utf8'));
    const adminRaw = JSON.parse(fs.readFileSync(adminDbPath, 'utf8'));

    assert(Array.isArray(catalogRaw.songs) && !catalogRaw.playlists && !catalogRaw.users, 
      'Catalog DB contains ONLY songs/artists/albums (no playlists or users)', results);
    assert(Array.isArray(playlistRaw.playlists) && !playlistRaw.songs && !playlistRaw.users, 
      'Playlist DB contains ONLY playlists (no songs or users)', results);
    assert(Array.isArray(userRaw.users) && Array.isArray(userRaw.likes) && !userRaw.songs, 
      'User DB contains ONLY users/likes/history (no song catalogue)', results);
    assert(Array.isArray(adminRaw.auditLogs) && !adminRaw.songs, 
      'Admin DB contains ONLY audit logs (no song catalogue or users)', results);

    // ------------------------------------------------------------------
    // TEST SUITE 4: Inter-Service HTTP Communication
    // ------------------------------------------------------------------
    console.log('\n📌 Section 4: Cross-Service Inter-Service REST HTTP Communication');

    // Create a playlist with a song ID via Gateway
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-token-microservice-user',
      'X-Demo-User': JSON.stringify({ uid: 'ms-user-999', email: 'ms@cloudtune.io' })
    };

    const plRes = await request(`http://localhost:${GATEWAY_PORT}/api/playlists`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Microservice Inter-Service Playlist' })
    });
    assert(plRes.status === 201, 'Created playlist via Gateway -> Playlist Service', results);
    const playlistId = plRes.data?.id;

    // Add song-1 to playlist
    await request(`http://localhost:${GATEWAY_PORT}/api/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ songId: 'song-1' })
    });

    // Fetch playlist details: Playlist Service MUST call Catalog Service to enrich track details
    const plDetails = await request(`http://localhost:${GATEWAY_PORT}/api/playlists/${playlistId}`);
    assert(plDetails.status === 200, 'GET /api/playlists/:id returned 200', results);
    assert(Array.isArray(plDetails.data?.songs) && plDetails.data.songs.length === 1, 'Playlist enriched with songs array', results);
    assert(plDetails.data?.songs[0]?.title === 'SoundHelix Song 1', 'Track title correctly resolved from Catalog Service over HTTP', results);

    // Like a song: User Service records like and enriches track data via Catalog Service
    await request(`http://localhost:${GATEWAY_PORT}/api/songs/song-2/like`, {
      method: 'POST',
      headers: authHeaders
    });
    const userLikes = await request(`http://localhost:${GATEWAY_PORT}/api/users/me/likes`, {
      headers: authHeaders
    });
    assert(userLikes.status === 200, 'GET /api/users/me/likes returned 200', results);
    const likedItem = userLikes.data?.likes?.find(l => l.songId === 'song-2');
    assert(Boolean(likedItem?.song?.title === 'SoundHelix Song 2'), 'Liked song track metadata resolved from Catalog Service over HTTP', results);

    console.log('\n==============================================================');
    console.log(`🏁 Microservice Test Results: ${results.passed} Passed, ${results.failed} Failed`);
    console.log('==============================================================\n');

    server.close();
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal microservices test error:', err);
    server.close();
    process.exit(1);
  }
};

server = app.listen(GATEWAY_PORT, () => {
  runMicroserviceTests();
});
