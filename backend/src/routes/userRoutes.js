import express from 'express';
import { 
  getCurrentUser, 
  getUserLikes, 
  likeSong, 
  unlikeSong, 
  getListeningHistory, 
  recordListeningHistory 
} from '../controllers/userController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Current User Profile
router.get('/users/me', verifyAuth, getCurrentUser);

// Likes
router.get('/users/me/likes', verifyAuth, getUserLikes);
router.post('/songs/:id/like', verifyAuth, likeSong);
router.delete('/songs/:id/like', verifyAuth, unlikeSong);

// Listening History
router.get('/users/me/history', verifyAuth, getListeningHistory);
router.post('/users/me/history', verifyAuth, recordListeningHistory);

export default router;
