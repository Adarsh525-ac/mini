import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from '../../../shared/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.ADMIN_PORT || 5004;

app.set('serviceName', 'Admin Microservice');

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', adminRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'CloudTune Admin Microservice',
    status: 'online',
    port: PORT,
    databaseIsolation: 'Enforced (Admin DB)',
    endpoints: ['/api/health', '/api/admin/stats', '/api/admin/logs']
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.CHILD_SERVICE) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️  [Admin Service] running on http://localhost:${PORT}`);
  });
}

export default app;
