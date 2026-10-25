import express from 'express';
import { 
  getUserPlaylists, 
  getPlaylistById, 
  createPlaylist, 
  updatePlaylist, 
  deletePlaylist, 
  addSongToPlaylist, 
  removeSongFromPlaylist 
} from '../controllers/playlistController.js';
import { verifyAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/playlists', verifyAuth, getUserPlaylists);
router.post('/playlists', verifyAuth, createPlaylist);
router.get('/playlists/:id', optionalAuth, getPlaylistById);
router.patch('/playlists/:id', verifyAuth, updatePlaylist);
router.delete('/playlists/:id', verifyAuth, deletePlaylist);
router.post('/playlists/:id/songs', verifyAuth, addSongToPlaylist);
router.delete('/playlists/:id/songs/:songId', verifyAuth, removeSongFromPlaylist);

export default router;
