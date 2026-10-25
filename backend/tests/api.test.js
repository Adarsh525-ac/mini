/**
 * CloudTune API Automated Test Suite
 * Tests health checks, song catalogue, search, auth guards, likes, and playlists.
 */
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/server.js');

const TEST_PORT = 5099;
let server;

const runTests = async () => {
  console.log('🧪 Starting CloudTune Backend Automated Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  // Helper fetch wrapper
  const request = async (path, options = {}) => {
    const url = `http://localhost:${TEST_PORT}${path}`;
    const res = await fetch(url, options);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  };

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert(health.status === 200, 'GET /api/health returns 200 status');
    assert(health.data?.status === 'healthy', 'GET /api/health reports system status healthy');
    assert(health.data?.platform.includes('Cloud Run'), 'GET /api/health reports Cloud Run architecture');

    // 2. Song Catalogue
    const songs = await request('/api/songs');
    assert(songs.status === 200, 'GET /api/songs returns 200 status');
    assert(Array.isArray(songs.data?.songs), 'GET /api/songs returns songs array');
    assert(songs.data?.songs?.length > 0, `GET /api/songs returns initial seed tracks (count: ${songs.data?.songs?.length})`);

    // 3. Search and Filtering
    const searchRes = await request('/api/songs?q=Helix');
    assert(searchRes.status === 200, 'GET /api/songs?q=Helix returns 200');
    assert(searchRes.data?.songs?.every(s => s.title.includes('Helix') || s.artistName.includes('Helix')), 'Search query filters results correctly');

    const genreRes = await request('/api/songs?genre=Electronic');
    assert(genreRes.status === 200, 'GET /api/songs?genre=Electronic returns 200');
    assert(genreRes.data?.songs?.every(s => s.genre === 'Electronic'), 'Genre filter returns only Electronic tracks');

    // 4. Single Song & Stream
    const singleSong = await request('/api/songs/song-1');
    assert(singleSong.status === 200, 'GET /api/songs/song-1 returns 200');
    assert(singleSong.data?.id === 'song-1', 'Single song returns matching id');

    const stream = await request('/api/songs/song-1/stream');
    assert(stream.status === 200, 'GET /api/songs/song-1/stream returns 200');
    assert(Boolean(stream.data?.streamUrl), 'Stream endpoint provides valid streamUrl');

    // 5. Auth Guards & Security
    const unauthPlaylist = await request('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Playlist' })
    });
    assert(unauthPlaylist.status === 401, 'POST /api/playlists without token is blocked with 401 Unauthorized');

    const unauthAdmin = await request('/api/admin/stats');
    assert(unauthAdmin.status === 401, 'GET /api/admin/stats without token is blocked with 401 Unauthorized');

    // 6. Authenticated User Flow
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-token-test-listener-123',
      'X-Demo-User': JSON.stringify({
        uid: 'test-listener-123',
        email: 'listener@cloudtune.io',
        displayName: 'Test Student'
      })
    };

    const userProfile = await request('/api/users/me', { headers: authHeaders });
    assert(userProfile.status === 200, 'GET /api/users/me returns authenticated profile');
    assert(userProfile.data?.uid === 'test-listener-123', 'User profile matches token UID');

    // Create Playlist
    const createPl = await request('/api/playlists', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'MCA Exam Playlist' })
    });
    assert(createPl.status === 201, 'POST /api/playlists with token creates playlist (201)');
    const playlistId = createPl.data?.id;

    // Like Song
    const like = await request('/api/songs/song-1/like', {
      method: 'POST',
      headers: authHeaders
    });
    assert(like.status === 200, 'POST /api/songs/song-1/like records user like');

    const likesList = await request('/api/users/me/likes', { headers: authHeaders });
    assert(likesList.data?.likes?.some(l => l.songId === 'song-1'), 'Liked song appears in /api/users/me/likes');

    // Record History
    const hist = await request('/api/users/me/history', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ songId: 'song-1' })
    });
    assert(hist.status === 201, 'POST /api/users/me/history records track play event');

    // 7. Admin Authorized Flow
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-token-admin-123',
      'X-Demo-User': JSON.stringify({
        uid: 'admin-123',
        email: 'admin@cloudtune.io',
        role: 'admin'
      })
    };

    const adminStats = await request('/api/admin/stats', { headers: adminHeaders });
    assert(adminStats.status === 200, 'GET /api/admin/stats with verified admin role returns 200');
    assert(adminStats.data?.cloudPlatform === 'Google Cloud Platform', 'Admin stats confirms Google Cloud Platform architecture');

    console.log(`\n==============================================================`);
    console.log(`🏁 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`==============================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
};

// Start standalone test server instance
server = app.listen(TEST_PORT, () => {
  runTests();
});
