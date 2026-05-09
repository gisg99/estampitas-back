import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import { requireAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import collectionRouter from './routes/collection.js';
import statsRouter from './routes/stats.js';
import seleccionesRouter from './routes/selecciones.js';
import tradeRouter from './routes/trade.js';
import tradeRequestsRouter from './routes/tradeRequests.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/selecciones', seleccionesRouter);
app.use('/api/trade', tradeRouter);

app.use('/api/user',           requireAuth, userRouter);
app.use('/api/collection',     requireAuth, collectionRouter);
app.use('/api/stats',          requireAuth, statsRouter);
app.use('/api/trade-requests', requireAuth, tradeRequestsRouter);

initDB()
  .then(() => app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`)))
  .catch(err => { console.error('Error iniciando DB:', err); process.exit(1); });
