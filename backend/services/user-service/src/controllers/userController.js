import path from 'path';
import { fileURLToPath } from 'url';
import { IsolatedStore } from '../../../../shared/isolatedStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Catalog Service endpoint for inter-service communication
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:5001';

// Initialize Isolated Database dedicated solely to User Service
const dbPath = process.env.USER_DB_PATH || path.resolve(__dirname, '../../data/users.db.json');

export const userStore = new IsolatedStore({
  name: 'User-Isolated-Database',
  dbPath,
  initialData: {
    users: [
      {
        id: 'admin-123',
        uid: 'admin-123',
        email: 'admin@cloudtune.io',
        displayName: 'Administrator',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ],
    likes: [],
    history: []
  }
});

const usersCol = userStore.collection('users');
const likesCol = userStore.collection('likes');
const historyCol = userStore.collection('history');

/**
 * Inter-service helper: Fetch song details from Catalog Service via HTTP REST
 */
const fetchSongDetails = async (songId) => {
  try {
    const res = await fetch(`${CATALOG_SERVICE_URL}/api/songs/${songId}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn(`[User Service] Inter-service call to Catalog Service failed for song ${songId}:`, err.message);
    return null;
  }
};

/**
 * GET /api/users/me
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const { uid, email, name, displayName, picture, role } = req.user;
    let existingUser = usersCol.findOne({ uid });

    if (!existingUser) {
      const newUser = {
        id: uid,
        uid,
        email: email || 'demo@cloudtune.io',
        displayName: displayName || name || email?.split('@')[0] || 'Listener',
        photoURL: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || uid}`,
        role: role || (email === 'admin@cloudtune.io' ? 'admin' : 'user'),
        createdAt: new Date().toISOString()
      };
      existingUser = usersCol.insert(newUser);
    }

    res.json(existingUser);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/likes
 * Returns user likes enriched with song details from Catalog Service
 */
export const getUserLikes = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const userLikes = likesCol.find({ userUid: uid });

    // Inter-Service Communication: Fetch song details for each liked song from Catalog Service
    const enrichedLikes = await Promise.all(
      userLikes.map(async (like) => {
        const song = await fetchSongDetails(like.songId);
        return {
          id: like.id,
          songId: like.songId,
          song: song || { id: like.songId, title: 'Unknown Song' },
          likedAt: like.likedAt
        };
      })
    );

    res.json({ likes: enrichedLikes });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/songs/:id/like
 * Add song to user's likes in isolated user DB
 */
export const likeSong = async (req, res, next) => {
  try {
    const songId = req.params.id;
    const uid = req.user.uid;

    const existing = likesCol.findOne({ userUid: uid, songId });
    if (existing) {
      return res.json({ message: 'Song already liked', liked: true });
    }

    likesCol.insert({
      id: `${uid}_${songId}`,
      userUid: uid,
      songId,
      likedAt: new Date().toISOString()
    });

    res.json({ message: 'Song liked successfully', liked: true });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/songs/:id/like
 * Remove song from user's likes
 */
export const unlikeSong = async (req, res, next) => {
  try {
    const songId = req.params.id;
    const uid = req.user.uid;

    const existing = likesCol.findOne({ userUid: uid, songId });
    if (existing) {
      likesCol.delete(existing.id);
    }

    res.json({ message: 'Song unliked successfully', liked: false });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/history
 */
export const getListeningHistory = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const userHistory = historyCol.find({ userUid: uid });

    // Enrich history tracks via Catalog Service
    const enriched = await Promise.all(
      userHistory.slice(-50).reverse().map(async (item) => {
        const song = await fetchSongDetails(item.songId);
        return {
          id: item.id,
          songId: item.songId,
          song: song || { id: item.songId, title: 'Unknown Track' },
          playedAt: item.playedAt
        };
      })
    );

    res.json({ history: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/me/history
 */
export const recordListeningHistory = async (req, res, next) => {
  try {
    const { songId } = req.body;
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' });
    }

    const uid = req.user.uid;
    const record = historyCol.insert({
      userUid: uid,
      songId,
      playedAt: new Date().toISOString()
    });

    res.status(201).json({ message: 'Playback logged', record });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/stats
 * Internal stats for Admin Service
 */
export const getUserStats = (req, res) => {
  res.json({
    totalUsers: usersCol.count(),
    totalLikes: likesCol.count(),
    totalHistoryPlays: historyCol.count()
  });
};

/**
 * Health Check for User Microservice
 */
export const getUserHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    port: process.env.PORT || 5003,
    uptimeSeconds: Math.floor(process.uptime()),
    database: userStore.getMetadata(),
    timestamp: new Date().toISOString()
  });
};
