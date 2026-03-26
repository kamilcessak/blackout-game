import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import mapRoutes from './features/map/map.routes';
import inventoryRoutes from './features/inventory/inventory.routes';
import playerRoutes from './features/player/player.routes';
import { startSurvivalTick } from './features/player/player.cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/map', mapRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/player', playerRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Połączono z bazą dowodzenia Blackout!' });
});

startSurvivalTick();

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
