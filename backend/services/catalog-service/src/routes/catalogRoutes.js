import express from 'express';
import {
  getSongs,
  getSongsBatch,
  getSongById,
  getSongStream,
  streamLocal,
  createSong,
  updateSong,
  deleteSong,
  getArtists,
  getAlbums,
  getCatalogHealth
} from '../controllers/catalogController.js';
import { optionalAuth } from '../../../../shared/auth.js';

const router = express.Router();

// Microservice Health
router.get('/health', getCatalogHealth);

// Public / Authenticated Song Endpoints
router.get('/songs', optionalAuth, getSongs);
router.get('/songs/batch', getSongsBatch);
router.get('/songs/stream-local', streamLocal);
router.get('/songs/:id/stream', optionalAuth, getSongStream);
router.get('/songs/:id', optionalAuth, getSongById);

// Internal / Admin mutation endpoints (called directly or from Admin service)
router.post('/songs', createSong);
router.patch('/songs/:id', updateSong);
router.delete('/songs/:id', deleteSong);

// Artists & Albums
router.get('/artists', getArtists);
router.get('/albums', getAlbums);

export default router;
