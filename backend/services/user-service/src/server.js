import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from '../../../shared/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.USER_PORT || 5003;

app.set('serviceName', 'User Microservice');

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'CloudTune User Microservice',
    status: 'online',
    port: PORT,
    databaseIsolation: 'Enforced (User DB)',
    endpoints: ['/api/health', '/api/users/me', '/api/users/me/likes', '/api/users/me/history']
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.CHILD_SERVICE) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`👤 [User Service] running on http://localhost:${PORT}`);
  });
}

export default app;
