import { firestoreDb, isFirebaseInitialized } from '../config/firebase.js';
import { getInMemorySongs } from './songController.js';

// In-memory fallbacks
let inMemoryLikes = []; // { userId, songId, likedAt }
let inMemoryHistory = []; // { userUid, songId, playedAt }

export const getCurrentUser = async (req, res, next) => {
  try {
    const { uid, email, name, picture, role } = req.user;

    if (isFirebaseInitialized && firestoreDb) {
      const userRef = firestoreDb.collection('users').doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        // Initial user registration in Firestore
        const newUser = {
          uid,
          email: email || '',
          displayName: name || email?.split('@')[0] || 'Listener',
          photoURL: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || uid}`,
          role: email === 'admin@cloudtune.io' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await userRef.set(newUser);
        return res.json(newUser);
      }

      return res.json({ uid: doc.id, ...doc.data() });
    }

    res.json({
      uid,
      email: email || 'demo@cloudtune.io',
      displayName: name || email?.split('@')[0] || 'Demo User',
      photoURL: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || uid}`,
      role: role || (email === 'admin@cloudtune.io' ? 'admin' : 'user')
    });
  } catch (error) {
    next(error);
  }
};

export const getUserLikes = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    if (isFirebaseInitialized && firestoreDb) {
      const snap = await firestoreDb.collection('likes')
        .where('userUid', '==', uid)
        .get();

      const likes = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        // Fetch song details
        const sDoc = await firestoreDb.collection('songs').doc(data.songId).get();
        if (sDoc.exists) {
          likes.push({
            id: doc.id,
            songId: data.songId,
            song: { id: sDoc.id, ...sDoc.data() },
            likedAt: data.likedAt
          });
        }
      }
      return res.json({ likes });
    }

    const allSongs = getInMemorySongs();
    const userLikes = inMemoryLikes
      .filter(l => l.userId === uid)
      .map(l => ({
        songId: l.songId,
        song: allSongs.find(s => s.id === l.songId) || { id: l.songId, title: 'Demo Song' },
        likedAt: l.likedAt
      }));

    res.json({ likes: userLikes });
  } catch (error) {
    next(error);
  }
};

export const likeSong = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { id: songId } = req.params;
    const docId = `${uid}_${songId}`;

    if (isFirebaseInitialized && firestoreDb) {
      await firestoreDb.collection('likes').doc(docId).set({
        userUid: uid,
        songId,
        likedAt: new Date().toISOString()
      }, { merge: true });

      return res.json({ message: 'Song liked', songId });
    }

    if (!inMemoryLikes.some(l => l.userId === uid && l.songId === songId)) {
      inMemoryLikes.push({ userId: uid, songId, likedAt: new Date().toISOString() });
    }
    res.json({ message: 'Song liked', songId });
  } catch (error) {
    next(error);
  }
};

export const unlikeSong = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { id: songId } = req.params;
    const docId = `${uid}_${songId}`;

    if (isFirebaseInitialized && firestoreDb) {
      await firestoreDb.collection('likes').doc(docId).delete();
      return res.json({ message: 'Song unliked', songId });
    }

    inMemoryLikes = inMemoryLikes.filter(l => !(l.userId === uid && l.songId === songId));
    res.json({ message: 'Song unliked', songId });
  } catch (error) {
    next(error);
  }
};

export const getListeningHistory = async (req, res, next) => {
  try {
    const uid = req.user.uid;

    if (isFirebaseInitialized && firestoreDb) {
      const snap = await firestoreDb.collection('listeningHistory')
        .where('userUid', '==', uid)
        .orderBy('playedAt', 'desc')
        .limit(25)
        .get();

      const history = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        const sDoc = await firestoreDb.collection('songs').doc(data.songId).get();
        if (sDoc.exists) {
          history.push({
            id: doc.id,
            songId: data.songId,
            song: { id: sDoc.id, ...sDoc.data() },
            playedAt: data.playedAt
          });
        }
      }
      return res.json({ history });
    }

    const allSongs = getInMemorySongs();
    const list = inMemoryHistory
      .filter(h => h.userUid === uid)
      .slice(-25)
      .reverse()
      .map(h => ({
        songId: h.songId,
        song: allSongs.find(s => s.id === h.songId) || { id: h.songId, title: 'Demo Song' },
        playedAt: h.playedAt
      }));

    res.json({ history: list });
  } catch (error) {
    next(error);
  }
};

export const recordListeningHistory = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { songId } = req.body;

    if (!songId) return res.status(400).json({ error: 'songId is required' });

    const entry = {
      userUid: uid,
      songId,
      playedAt: new Date().toISOString()
    };

    if (isFirebaseInitialized && firestoreDb) {
      await firestoreDb.collection('listeningHistory').add(entry);
      return res.status(201).json({ message: 'Play history recorded' });
    }

    inMemoryHistory.push(entry);
    res.status(201).json({ message: 'Play history recorded' });
  } catch (error) {
    next(error);
  }
};
