import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import catalogRoutes from './routes/catalogRoutes.js';
import { errorHandler } from '../../../shared/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.CATALOG_PORT || 5001;

app.set('serviceName', 'Catalog Microservice');

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount microservice routes under /api
app.use('/api', catalogRoutes);

// Root information
app.get('/', (req, res) => {
  res.json({
    service: 'CloudTune Catalog Microservice',
    status: 'online',
    port: PORT,
    databaseIsolation: 'Enforced (Catalog DB)',
    endpoints: ['/api/health', '/api/songs', '/api/artists', '/api/albums']
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.CHILD_SERVICE) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 [Catalog Service] running on http://localhost:${PORT}`);
  });
}

export default app;
