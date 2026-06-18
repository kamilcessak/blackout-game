import './config/env';

import express, { NextFunction, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';

import { requestLogger } from './middleware/requestLogger';
import mapRoutes from './features/map/map.routes';
import inventoryRoutes from './features/inventory/inventory.routes';
import playerRoutes from './features/player/player.routes';
import authRoutes from './features/auth/auth.routes';
import adminRoutes from './features/admin/admin.routes';
import { startSurvivalTick } from './features/player/player.cron';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS sterowany środowiskiem: CORS_ORIGIN to lista dozwolonych originów po przecinku.
// Brak zmiennej => tryb otwarty (wygodny w dev). W produkcji ustaw konkretne originy.
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions =
  allowedOrigins.length > 0
    ? {
        origin(origin, callback) {
          // Brak origin (np. curl, aplikacje mobilne) przepuszczamy.
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error(`Origin ${origin} nie jest dozwolony przez CORS.`));
        },
      }
    : {};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Połączono z bazą dowodzenia Blackout!' });
});

// 404 dla nieznanych tras API.
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Nie znaleziono zasobu.' });
});

// Globalny handler błędów — łapie wyjątki z handlerów i błędy z middleware (np. CORS),
// żeby nigdy nie wyciekła surowa stack trace ani nie wisiało zapytanie.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Nieobsłużony błąd:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
});

startSurvivalTick();

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});

// Ostatnia linia obrony — loguj zamiast ubijać proces przy nieprzechwyconym błędzie.
process.on('unhandledRejection', (reason) => {
  console.error('Nieobsłużone odrzucenie obietnicy:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Nieprzechwycony wyjątek:', err);
});
