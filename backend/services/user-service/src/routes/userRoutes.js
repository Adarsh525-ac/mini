import express from 'express';
import {
  getCurrentUser,
  getUserLikes,
  likeSong,
  unlikeSong,
  getListeningHistory,
  recordListeningHistory,
  getUserStats,
  getUserHealth
} from '../controllers/userController.js';
import { verifyAuth } from '../../../../shared/auth.js';

const router = express.Router();

router.get('/health', getUserHealth);
router.get('/users/stats', getUserStats);

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
