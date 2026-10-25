import path from 'path';
import { fileURLToPath } from 'url';
import { IsolatedStore } from '../../../../shared/isolatedStore.js';
import { uploadFileToStorage, deleteFileFromStorage, isGcsAvailable, BUCKET_NAME } from '../../../../shared/gcpStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:5001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5003';

// Initialize Isolated Database dedicated solely to Admin Service
const dbPath = process.env.ADMIN_DB_PATH || path.resolve(__dirname, '../../data/admin.db.json');

export const adminStore = new IsolatedStore({
  name: 'Admin-Isolated-Database',
  dbPath,
  initialData: {
    auditLogs: []
  }
});

const auditLogsCol = adminStore.collection('auditLogs');

/**
 * POST /api/admin/songs
 * Handles multipart file uploads and calls Catalog Service via HTTP to insert song
 */
export const addSong = async (req, res, next) => {
  try {
    const { title, artistName, albumName, genre, duration, coverUrl } = req.body;
    const files = req.files || {};
    const audioFile = files['audio'] ? files['audio'][0] : null;
    const coverFile = files['cover'] ? files['cover'][0] : null;

    if (!title || !artistName) {
      return res.status(400).json({ error: 'Title and artistName are required' });
    }

    const timestamp = Date.now();
    let audioObjectPath = 'audio/song-1.mp3';
    let coverObjectPath = coverUrl || 'covers/cover-1.jpg';
    let finalAudioUrl = null;
    let finalCoverUrl = coverUrl || null;

    // 1. Upload Audio File if provided
    if (audioFile) {
      const ext = audioFile.originalname.split('.').pop() || 'mp3';
      const destination = `audio/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
      const uploadRes = await uploadFileToStorage(audioFile.buffer, destination, audioFile.mimetype);
      audioObjectPath = uploadRes.path;
      if (uploadRes.localUrl) {
        finalAudioUrl = uploadRes.localUrl;
      }
    }

    // 2. Upload Cover Image if provided
    if (coverFile) {
      const ext = coverFile.originalname.split('.').pop() || 'jpg';
      const destination = `covers/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
      const uploadRes = await uploadFileToStorage(coverFile.buffer, destination, coverFile.mimetype);
      coverObjectPath = uploadRes.path;
      if (uploadRes.localUrl) {
        finalCoverUrl = uploadRes.localUrl;
      }
    }

    const newSongPayload = {
      title,
      artistId: 'artist-' + timestamp,
      artistName,
      albumId: 'album-' + timestamp,
      albumName: albumName || 'Single',
      genre: genre || 'Electronic',
      duration: parseInt(duration, 10) || 210,
      audioObjectPath,
      audioUrl: finalAudioUrl,
      coverObjectPath,
      coverUrl: finalCoverUrl,
      createdAt: new Date().toISOString()
    };

    // Inter-Service Communication: Call Catalog Service to store song in isolated Catalog DB
    const catalogRes = await fetch(`${CATALOG_SERVICE_URL}/api/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSongPayload)
    });

    if (!catalogRes.ok) {
      const errData = await catalogRes.json().catch(() => ({}));
      return res.status(catalogRes.status).json({ error: errData.error || 'Failed to create song in Catalog Service' });
    }

    const createdSong = await catalogRes.json();

    // Record in isolated Admin Audit DB
    auditLogsCol.insert({
      action: 'ADD_SONG',
      songId: createdSong.id,
      title: createdSong.title,
      adminUid: req.user?.uid || 'admin',
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Song uploaded and registered in catalog successfully',
      song: createdSong
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/songs/:id
 */
export const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Call Catalog Service via HTTP
    const catalogRes = await fetch(`${CATALOG_SERVICE_URL}/api/songs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!catalogRes.ok) {
      return res.status(catalogRes.status).json({ error: 'Failed to update song in Catalog Service' });
    }

    const updated = await catalogRes.json();

    auditLogsCol.insert({
      action: 'UPDATE_SONG',
      songId: id,
      adminUid: req.user?.uid || 'admin',
      timestamp: new Date().toISOString()
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/songs/:id
 */
export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Get song info from Catalog Service
    const songRes = await fetch(`${CATALOG_SERVICE_URL}/api/songs/${id}`);
    if (songRes.ok) {
      const songData = await songRes.json();
      if (songData.audioObjectPath && !songData.audioObjectPath.startsWith('audio/song-')) {
        await deleteFileFromStorage(songData.audioObjectPath);
      }
      if (songData.coverObjectPath && !songData.coverObjectPath.startsWith('covers/cover-')) {
        await deleteFileFromStorage(songData.coverObjectPath);
      }
    }

    // 2. Delete from Catalog Service
    const catalogDeleteRes = await fetch(`${CATALOG_SERVICE_URL}/api/songs/${id}`, {
      method: 'DELETE'
    });

    if (!catalogDeleteRes.ok && catalogDeleteRes.status !== 404) {
      return res.status(catalogDeleteRes.status).json({ error: 'Failed to delete song in Catalog Service' });
    }

    auditLogsCol.insert({
      action: 'DELETE_SONG',
      songId: id,
      adminUid: req.user?.uid || 'admin',
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Song deleted successfully from catalog and storage' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Aggregates statistics by querying Catalog and User microservices
 */
export const getStats = async (req, res, next) => {
  try {
    let songCount = 0;
    let userCount = 1;

    // 1. Query Catalog Service for song total
    try {
      const cRes = await fetch(`${CATALOG_SERVICE_URL}/api/songs?limit=1`);
      if (cRes.ok) {
        const cData = await cRes.json();
        songCount = cData.total || 0;
      }
    } catch {}

    // 2. Query User Service for user total
    try {
      const uRes = await fetch(`${USER_SERVICE_URL}/api/users/stats`);
      if (uRes.ok) {
        const uData = await uRes.json();
        userCount = uData.totalUsers || 1;
      }
    } catch {}

    res.json({
      totalSongs: songCount,
      totalUsers: userCount,
      architecture: 'Distributed Microservices Architecture',
      isolationModel: 'Database-per-Service (Isolated Databases)',
      cloudPlatform: 'Google Cloud Platform',
      services: {
        compute: 'Google Cloud Run (Multi-Container Microservices)',
        database: 'Isolated Microservice Databases (Database-per-Service)',
        storage: isGcsAvailable ? `Cloud Storage (${BUCKET_NAME})` : 'Cloud Storage / Local Fallback',
        auth: 'Firebase Authentication / Secure JWT Verification'
      },
      microservices: [
        { name: 'API Gateway', port: 5000, status: 'online', role: 'Edge Routing & Proxy' },
        { name: 'Catalog Service', port: 5001, status: 'online', role: 'Songs, Artists, Albums' },
        { name: 'Playlist Service', port: 5002, status: 'online', role: 'User Playlists' },
        { name: 'User Service', port: 5003, status: 'online', role: 'Profiles, Likes, History' },
        { name: 'Admin Service', port: 5004, status: 'online', role: 'Uploads, Audit, Diagnostics' }
      ],
      auditLogsCount: auditLogsCol.count(),
      environment: process.env.NODE_ENV || 'development',
      region: process.env.GCP_REGION || 'us-central1'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/logs
 */
export const getAuditLogs = (req, res) => {
  res.json({ auditLogs: auditLogsCol.getAll().reverse() });
};

/**
 * Health Check for Admin Microservice
 */
export const getAdminHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'admin-service',
    port: process.env.PORT || 5004,
    uptimeSeconds: Math.floor(process.uptime()),
    database: adminStore.getMetadata(),
    timestamp: new Date().toISOString()
  });
};
