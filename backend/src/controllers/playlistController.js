import { firestoreDb, isFirebaseInitialized } from '../config/firebase.js';
import { getInMemorySongs } from './songController.js';

// In-memory playlists for development fallback
let inMemoryPlaylists = [];

export const getUserPlaylists = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    if (isFirebaseInitialized && firestoreDb) {
      const snap = await firestoreDb.collection('playlists')
        .where('ownerUid', '==', uid)
        .get();

      const playlists = [];
      snap.forEach(doc => {
        playlists.push({ id: doc.id, ...doc.data() });
      });
      return res.json(playlists);
    }

    const list = inMemoryPlaylists.filter(p => p.ownerUid === uid);
    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const getPlaylistById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isFirebaseInitialized && firestoreDb) {
      const doc = await firestoreDb.collection('playlists').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      const playlist = { id: doc.id, ...doc.data() };
      
      // Populate song details
      const songs = [];
      if (playlist.songIds && playlist.songIds.length > 0) {
        for (const songId of playlist.songIds) {
          const sDoc = await firestoreDb.collection('songs').doc(songId).get();
          if (sDoc.exists) {
            songs.push({ id: sDoc.id, ...sDoc.data() });
          }
        }
      }
      return res.json({ ...playlist, songs });
    }

    const playlist = inMemoryPlaylists.find(p => p.id === id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    const allSongs = getInMemorySongs();
    const songs = (playlist.songIds || []).map(sid => allSongs.find(s => s.id === sid)).filter(Boolean);
    res.json({ ...playlist, songs });
  } catch (error) {
    next(error);
  }
};

export const createPlaylist = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const uid = req.user.uid;
    const newPlaylist = {
      name: name.trim(),
      ownerUid: uid,
      ownerName: req.user.name || req.user.email?.split('@')[0] || 'User',
      songIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseInitialized && firestoreDb) {
      const ref = await firestoreDb.collection('playlists').add(newPlaylist);
      return res.status(201).json({ id: ref.id, ...newPlaylist });
    }

    const id = 'playlist-' + Math.random().toString(36).substring(7);
    const item = { id, ...newPlaylist };
    inMemoryPlaylists.push(item);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const uid = req.user.uid;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist name cannot be empty' });
    }

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('playlists').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Playlist not found' });

      // Verify ownership
      if (doc.data().ownerUid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
      }

      await ref.update({
        name: name.trim(),
        updatedAt: new Date().toISOString()
      });
      return res.json({ id, ...doc.data(), name: name.trim() });
    }

    const idx = inMemoryPlaylists.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
    if (inMemoryPlaylists[idx].ownerUid !== uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    inMemoryPlaylists[idx].name = name.trim();
    inMemoryPlaylists[idx].updatedAt = new Date().toISOString();
    res.json(inMemoryPlaylists[idx]);
  } catch (error) {
    next(error);
  }
};

export const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('playlists').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Playlist not found' });

      if (doc.data().ownerUid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
      }

      await ref.delete();
      return res.json({ message: 'Playlist deleted successfully' });
    }

    const idx = inMemoryPlaylists.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Playlist not found' });
    if (inMemoryPlaylists[idx].ownerUid !== uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
    }

    inMemoryPlaylists.splice(idx, 1);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const addSongToPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { songId } = req.body;
    const uid = req.user.uid;

    if (!songId) return res.status(400).json({ error: 'songId is required' });

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('playlists').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Playlist not found' });

      if (doc.data().ownerUid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
      }

      const songIds = doc.data().songIds || [];
      if (!songIds.includes(songId)) {
        songIds.push(songId);
        await ref.update({ songIds, updatedAt: new Date().toISOString() });
      }
      return res.json({ message: 'Song added to playlist', songIds });
    }

    const pl = inMemoryPlaylists.find(p => p.id === id);
    if (!pl) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.ownerUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    if (!pl.songIds.includes(songId)) {
      pl.songIds.push(songId);
      pl.updatedAt = new Date().toISOString();
    }
    res.json({ message: 'Song added to playlist', songIds: pl.songIds });
  } catch (error) {
    next(error);
  }
};

export const removeSongFromPlaylist = async (req, res, next) => {
  try {
    const { id, songId } = req.params;
    const uid = req.user.uid;

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('playlists').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Playlist not found' });

      if (doc.data().ownerUid !== uid && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You do not own this playlist' });
      }

      const songIds = (doc.data().songIds || []).filter(sid => sid !== songId);
      await ref.update({ songIds, updatedAt: new Date().toISOString() });
      return res.json({ message: 'Song removed from playlist', songIds });
    }

    const pl = inMemoryPlaylists.find(p => p.id === id);
    if (!pl) return res.status(404).json({ error: 'Playlist not found' });
    if (pl.ownerUid !== uid) return res.status(403).json({ error: 'Forbidden' });

    pl.songIds = pl.songIds.filter(sid => sid !== songId);
    pl.updatedAt = new Date().toISOString();
    res.json({ message: 'Song removed from playlist', songIds: pl.songIds });
  } catch (error) {
    next(error);
  }
};
