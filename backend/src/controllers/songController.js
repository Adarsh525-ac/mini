import { firestoreDb, isFirebaseInitialized } from '../config/firebase.js';
import { generateSignedStreamUrl } from '../config/gcpStorage.js';
import { initialSongs, initialArtists, initialAlbums } from '../utils/seedData.js';
import fs from 'fs';
import path from 'path';

// In-memory memory store for local development fallback
let inMemorySongs = [...initialSongs];
let inMemoryArtists = [...initialArtists];
let inMemoryAlbums = [...initialAlbums];

export const getInMemorySongs = () => inMemorySongs;
export const setInMemorySongs = (newSongs) => { inMemorySongs = newSongs; };

/**
 * GET /api/songs
 * Supports ?q= (search), ?genre=, ?page=, ?limit=
 */
export const getSongs = async (req, res, next) => {
  try {
    const { q, genre, page = 1, limit = 20 } = req.query;

    if (isFirebaseInitialized && firestoreDb) {
      let queryRef = firestoreDb.collection('songs');

      if (genre && genre !== 'All') {
        queryRef = queryRef.where('genre', '==', genre);
      }

      const snapshot = await queryRef.get();
      let songs = [];
      snapshot.forEach(doc => {
        songs.push({ id: doc.id, ...doc.data() });
      });

      // Filter by search query in memory (Firestore does not support full-text wildcard queries natively)
      if (q) {
        const queryLower = q.toLowerCase();
        songs = songs.filter(song => 
          (song.title && song.title.toLowerCase().includes(queryLower)) ||
          (song.artistName && song.artistName.toLowerCase().includes(queryLower)) ||
          (song.albumName && song.albumName.toLowerCase().includes(queryLower))
        );
      }

      // Pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedSongs = songs.slice(startIndex, startIndex + limitNum);

      return res.json({
        total: songs.length,
        page: pageNum,
        limit: limitNum,
        songs: paginatedSongs
      });
    }

    // Local in-memory fallback
    let filtered = [...inMemorySongs];
    if (genre && genre !== 'All') {
      filtered = filtered.filter(s => s.genre?.toLowerCase() === genre.toLowerCase());
    }
    if (q) {
      const queryLower = q.toLowerCase();
      filtered = filtered.filter(s => 
        (s.title && s.title.toLowerCase().includes(queryLower)) ||
        (s.artistName && s.artistName.toLowerCase().includes(queryLower)) ||
        (s.albumName && s.albumName.toLowerCase().includes(queryLower))
      );
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      total: filtered.length,
      page: pageNum,
      limit: limitNum,
      songs: paginated
    });
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

    if (isFirebaseInitialized && firestoreDb) {
      const doc = await firestoreDb.collection('songs').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Song not found' });
      }
      return res.json({ id: doc.id, ...doc.data() });
    }

    const song = inMemorySongs.find(s => s.id === id);
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
 * Returns a short-lived V4 signed URL or direct audio stream endpoint
 */
export const getSongStream = async (req, res, next) => {
  try {
    const { id } = req.params;
    let song = null;

    if (isFirebaseInitialized && firestoreDb) {
      const doc = await firestoreDb.collection('songs').doc(id).get();
      if (doc.exists) song = { id: doc.id, ...doc.data() };
    } else {
      song = inMemorySongs.find(s => s.id === id);
    }

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.audioUrl) {
      return res.json({ streamUrl: song.audioUrl });
    }

    // Generate signed URL for GCS object path
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
 * HTTP 206 Partial Content range stream support for audio seeking
 */
export const streamLocal = (req, res) => {
  const fileQuery = req.query.file;
  if (!fileQuery) return res.status(400).send('File parameter required');

  const filePath = path.resolve('uploads', fileQuery);
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
 * GET /api/artists
 */
export const getArtists = async (req, res, next) => {
  try {
    if (isFirebaseInitialized && firestoreDb) {
      const snap = await firestoreDb.collection('artists').get();
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      return res.json(list);
    }
    res.json(inMemoryArtists);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/albums
 */
export const getAlbums = async (req, res, next) => {
  try {
    if (isFirebaseInitialized && firestoreDb) {
      const snap = await firestoreDb.collection('albums').get();
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      return res.json(list);
    }
    res.json(inMemoryAlbums);
  } catch (error) {
    next(error);
  }
};
