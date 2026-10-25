import { firestoreDb, isFirebaseInitialized } from '../config/firebase.js';
import { uploadFileToStorage, deleteFileFromStorage, isGcsAvailable, BUCKET_NAME } from '../config/gcpStorage.js';
import { getInMemorySongs, setInMemorySongs } from './songController.js';

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
    let audioObjectPath = 'audio/song-1.mp3'; // Fallback
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

    const newSong = {
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

    if (isFirebaseInitialized && firestoreDb) {
      const docRef = await firestoreDb.collection('songs').add(newSong);
      return res.status(201).json({ id: docRef.id, ...newSong });
    }

    const id = 'song-' + timestamp;
    const localSong = { id, ...newSong };
    const current = getInMemorySongs();
    setInMemorySongs([localSong, ...current]);

    res.status(201).json(localSong);
  } catch (error) {
    next(error);
  }
};

export const updateSong = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('songs').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Song not found' });

      await ref.update({
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return res.json({ id, ...doc.data(), ...updates });
    }

    const current = getInMemorySongs();
    const idx = current.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Song not found' });

    current[idx] = { ...current[idx], ...updates, updatedAt: new Date().toISOString() };
    setInMemorySongs(current);
    res.json(current[idx]);
  } catch (error) {
    next(error);
  }
};

export const deleteSong = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isFirebaseInitialized && firestoreDb) {
      const ref = firestoreDb.collection('songs').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Song not found' });

      const data = doc.data();
      // Remove objects from Cloud Storage
      if (data.audioObjectPath) await deleteFileFromStorage(data.audioObjectPath);
      if (data.coverObjectPath && !data.coverObjectPath.startsWith('http')) {
        await deleteFileFromStorage(data.coverObjectPath);
      }

      await ref.delete();
      return res.json({ message: 'Song and storage objects deleted successfully' });
    }

    const current = getInMemorySongs();
    const song = current.find(s => s.id === id);
    if (!song) return res.status(404).json({ error: 'Song not found' });

    setInMemorySongs(current.filter(s => s.id !== id));
    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    let songCount = 0;
    let userCount = 0;

    if (isFirebaseInitialized && firestoreDb) {
      const songsSnap = await firestoreDb.collection('songs').get();
      songCount = songsSnap.size;
      const usersSnap = await firestoreDb.collection('users').get();
      userCount = usersSnap.size;
    } else {
      songCount = getInMemorySongs().length;
      userCount = 1;
    }

    res.json({
      totalSongs: songCount,
      totalUsers: userCount,
      cloudPlatform: 'Google Cloud Platform',
      services: {
        compute: 'Google Cloud Run (Containerized Microservice)',
        database: isFirebaseInitialized ? 'Cloud Firestore (Active)' : 'Firestore Hybrid / Local',
        storage: isGcsAvailable ? `Cloud Storage (${BUCKET_NAME})` : 'Cloud Storage / Local Fallback',
        auth: isFirebaseInitialized ? 'Firebase Authentication' : 'Local Auth & JWT'
      },
      environment: process.env.NODE_ENV || 'development',
      region: process.env.GCP_REGION || 'us-central1'
    });
  } catch (error) {
    next(error);
  }
};
