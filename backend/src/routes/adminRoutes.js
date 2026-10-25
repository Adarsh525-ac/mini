import express from 'express';
import multer from 'multer';
import { 
  addSong, 
  updateSong, 
  deleteSong, 
  getStats 
} from '../controllers/adminController.js';
import { verifyAuth, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure Multer for in-memory file handling before Cloud Storage upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum audio track limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed for the audio field'));
      }
    } else if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for the cover field'));
      }
    } else {
      cb(null, true);
    }
  }
});

// All routes require both valid authentication and verified admin role
router.use(verifyAuth);
router.use(verifyAdmin);

router.post(
  '/admin/songs',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  addSong
);

router.patch('/admin/songs/:id', updateSong);
router.delete('/admin/songs/:id', deleteSong);
router.get('/admin/stats', getStats);

export default router;
