import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../../client/build')));

const games = new Map();

io.on('connection', (socket) => {
  console.log('Un utilisateur connecté:', socket.id);

  socket.on('join-game', (gameId: string, playerName: string) => {
    socket.join(gameId);
    console.log(`${playerName} a rejoint la partie ${gameId}`);
    
    if (!games.has(gameId)) {
      games.set(gameId, {
        players: [],
        board: initializeBoard(),
        currentTurn: 'heroes'
      });
    }
    
    const game = games.get(gameId);
    game.players.push({ id: socket.id, name: playerName });
    
    io.to(gameId).emit('game-state-update', game);
  });

  socket.on('player-move', (data: any) => {
    console.log('Mouvement reçu:', data);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

function initializeBoard() {
  return {
    tiles: Array(10).fill(null).map(() => Array(10).fill('empty')),
    heroes: [],
    monsters: []
  };
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});