/**
 * Point d'entrée Express + Socket.io (à côté du backend Nest existant).
 * Démarrage : node express-server.js
 * Variables : MONGODB_URI, AI_SERVICE_URL, PORT (défaut 5050)
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const initMatchingSocket = require('./socket/matchingSocket');
const matchingRoutes = require('./routes/matching.routes');
const workersRoutes = require('./routes/workers.routes');

const PORT = process.env.EXPRESS_PORT || process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmp-tn';

async function main() {
  await mongoose.connect(MONGODB_URI);

  const app = express();
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'HEAD', 'OPTIONS'],
      credentials: true,
    },
  });

  /** Exposé pour matching.routes + project.controller (notifyWorker) */
  app.set('io', io);
  initMatchingSocket(io);

  app.use('/api/matching', matchingRoutes);
  app.use('/api/workers', workersRoutes);

  app.get('/health-express', (_req, res) => {
    res.json({ ok: true, service: 'bmp-express' });
  });

  server.listen(PORT, () => {
    console.log(`Express + Socket.io http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
