import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { IsolatedStore } from '../../../../shared/isolatedStore.js';
import { initialSongs, initialArtists, initialAlbums } from '../../../../shared/seedData.js';
import { generateSignedStreamUrl } from '../../../../shared/gcpStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Isolated Database dedicated solely to Catalog Service
const dbPath = process.env.CATALOG_DB_PATH || path.resolve(__dirname, '../../data/catalog.db.json');

export const catalogStore = new IsolatedStore({
  name: 'Catalog-Isolated-Database',
  dbPath,
  initialData: {
    songs: initialSongs,
    artists: initialArtists,
    albums: initialAlbums
  }
});

const songsCol = catalogStore.collection('songs');
const artistsCol = catalogStore.collection('artists');
const albumsCol = catalogStore.collection('albums');

/**
 * GET /api/songs
 * Supports ?q= (search), ?genre=, ?page=, ?limit=
 */
export const getSongs = async (req, res, next) => {
  try {
    const { q, genre, page = 1, limit = 20 } = req.query;
    let list = songsCol.getAll();

    if (genre && genre !== 'All') {
      list = list.filter(s => s.genre?.toLowerCase() === genre.toLowerCase());
    }

    if (q) {
      const queryLower = q.toLowerCase();
      list = list.filter(s =>
        (s.title && s.title.toLowerCase().includes(queryLower)) ||
        (s.artistName && s.artistName.toLowerCase().includes(queryLower)) ||
        (s.albumName && s.albumName.toLowerCase().includes(queryLower))
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = list.slice(startIndex, startIndex + limitNum);

    res.json({
      total: list.length,
      page: pageNum,
      limit: limitNum,
      songs: paginated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/songs/batch?ids=id1,id2,id3
 * Enables other microservices (Playlist, User) to fetch song details in bulk via inter-service HTTP
 */
export const getSongsBatch = async (req, res, next) => {
  try {
    const idsQuery = req.query.ids;
    if (!idsQuery) {
      return res.json({ songs: [] });
    }
    const ids = idsQuery.split(',').map(id => id.trim()).filter(Boolean);
    const songs = ids.map(id => songsCol.findById(id)).filter(Boolean);
    res.json({ songs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/songs/:id
 */
export const getSongById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = songsCol.findById(id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/songs/:id/stream
 */
export const getSongStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    const song = songsCol.findById(id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.audioUrl) {
      return res.json({ streamUrl: song.audioUrl });
    }

    const streamUrl = await generateSignedStreamUrl(song.audioObjectPath);
    res.json({
      streamUrl,
      expiresInMinutes: 60,
      protocol: 'HTTPS Signed URL'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/songs/stream-local
 * HTTP 206 Partial Content range stream
 */
export const streamLocal = (req, res) => {
  const fileQuery = req.query.file;
  if (!fileQuery) return res.status(400).send('File parameter required');

  const baseDir = path.resolve(process.env.UPLOADS_DIR || 'uploads');
  const filePath = path.resolve(baseDir, fileQuery);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio file not found on disk');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

/**
 * POST /api/songs (Internal or Admin-initiated)
 */
export const createSong = async (req, res, next) => {
  try {
    const songData = req.body;
    if (!songData.title || !songData.artistName) {
      return res.status(400).json({ error: 'Title and artistName are required' });
    }
    const created = songsCol.insert(songData);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/songs/:id
 */
export const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = songsCol.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/songs/:id
 */
export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = songsCol.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json({ message: 'Song deleted successfully from catalog' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists
 */
export const getArtists = async (req, res, next) => {
  try {
    res.json(artistsCol.getAll());
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/albums
 */
export const getAlbums = async (req, res, next) => {
  try {
    res.json(albumsCol.getAll());
  } catch (error) {
    next(error);
  }
};

/**
 * Health Check for Catalog Microservice
 */
export const getCatalogHealth = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'catalog-service',
    port: process.env.PORT || 5001,
    uptimeSeconds: Math.floor(process.uptime()),
    database: catalogStore.getMetadata(),
    timestamp: new Date().toISOString()
  });
};
