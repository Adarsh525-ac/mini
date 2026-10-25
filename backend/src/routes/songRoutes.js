import express from 'express';
import { 
  getSongs, 
  getSongById, 
  getSongStream, 
  streamLocal, 
  getArtists, 
  getAlbums 
} from '../controllers/songController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public / Authenticated Song Endpoints
router.get('/songs', optionalAuth, getSongs);
router.get('/songs/stream-local', streamLocal);
router.get('/songs/:id/stream', optionalAuth, getSongStream);
router.get('/songs/:id', optionalAuth, getSongById);

// Public Artists & Albums
router.get('/artists', getArtists);
router.get('/albums', getAlbums);

export default router;
