import path from 'path';
import { fileURLToPath } from 'url';
import { IsolatedStore } from '../../../../shared/isolatedStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Catalog Service endpoint for inter-service communication
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:5001';

// Initialize Isolated Database dedicated solely to Playlist Service
const dbPath = process.env.PLAYLIST_DB_PATH || path.resolve(__dirname, '../../data/playlists.db.json');

export const playlistStore = new IsolatedStore({
  name: 'Playlist-Isolated-Database',
  dbPath,
  initialData: {
    playlists: []
  }
});

const playlistsCol = playlistStore.collection('playlists');

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
    console.warn(`[Playlist Service] Inter-service call to Catalog Service failed for song ${songId}:`, err.message);
    return null;
  }
};

/**
 * Inter-service helper: Fetch multiple songs in batch from Catalog Service
 */
const fetchBatchSongs = async (songIds) => {
  if (!songIds || songIds.length === 0) return [];
  try {
    const res = await fetch(`${CATALOG_SERVICE_URL}/api/songs/batch?ids=${songIds.join(',')}`);
    if (res.ok) {
      const data = await res.json();
      return data.songs || [];
    }
  } catch (err) {
    console.warn(`[Playlist Service] Batch song fetch failed, falling back to individual calls:`, err.message);
  }

  // Fallback to sequential/parallel individual calls
  const promises = songIds.map(id => fetchSongDetails(id));
  const results = await Promise.all(promises);
  return results.filter(Boolean);
};

/**
 * GET /api/playlists
 * Return all playlists belonging to the authenticated user
 */
export const getUserPlaylists = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const userPlaylists = playlistsCol.find({ ownerUid: uid });
    res.json(userPlaylists);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/playlists/:id
 * Returns playlist with enriched track details resolved from Catalog Service
 */
export const getPlaylistById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = playlistsCol.findById(id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Inter-Service Communication: Enrich track details via Catalog Service HTTP call
    const songIds = playlist.songIds || [];
    const songs = await fetchBatchSongs(songIds);

    res.json({
      ...playlist,
      songs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/playlists
 * Create a new personal playlist in isolated playlist DB
 */
export const createPlaylist = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const uid = req.user.uid;
    const newPlaylist = playlistsCol.insert({
      name: name.trim(),
      ownerUid: uid,
      ownerName: req.user.name || req.user.displayName || req.user.email?.split('@')[0] || 'User',
      songIds: []
    });

    res.status(201).json(newPlaylist);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/playlists/:id
 * Rename playlist
 */
export const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const playlist = playlistsCol.findById(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    const updated = playlistsCol.update(id, { name: name.trim() });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/playlists/:id
 */
export const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = playlistsCol.findById(id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    playlistsCol.delete(id);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/playlists/:id/songs
 * Add song to playlist
 */
export const addSongToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ error: 'songId is required' });
    }

    const playlist = playlistsCol.findById(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    const currentSongs = playlist.songIds || [];
    if (currentSongs.includes(songId)) {
      return res.json({ message: 'Song already in playlist', playlist });
    }

    const updatedSongs = [...currentSongs, songId];
    const updated = playlistsCol.update(id, { songIds: updatedSongs });
    res.json({ message: 'Song added to playlist', playlist: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/playlists/:id/songs/:songId
 * Remove song from playlist
 */
export const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const { id, songId } = req.params;
    const playlist = playlistsCol.findById(id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.ownerUid !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    const currentSongs = playlist.songIds || [];
    const updatedSongs = currentSongs.filter(s => s !== songId);
    const updated = playlistsCol.update(id, { songIds: updatedSongs });
    res.json({ message: 'Song removed from playlist', playlist: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Health Check for Playlist Microservice
 */
export const getPlaylistHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'playlist-service',
    port: process.env.PORT || 5002,
    uptimeSeconds: Math.floor(process.uptime()),
    database: playlistStore.getMetadata(),
    timestamp: new Date().toISOString()
  });
};
