import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import playlistRoutes from './routes/playlistRoutes.js';
import { errorHandler } from '../../../shared/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.PLAYLIST_PORT || 5002;

app.set('serviceName', 'Playlist Microservice');

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', playlistRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'CloudTune Playlist Microservice',
    status: 'online',
    port: PORT,
    databaseIsolation: 'Enforced (Playlist DB)',
    endpoints: ['/api/health', '/api/playlists']
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.CHILD_SERVICE) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎶 [Playlist Service] running on http://localhost:${PORT}`);
  });
}

export default app;
