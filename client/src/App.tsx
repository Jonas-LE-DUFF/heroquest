import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

interface GameState {
  players: any[];
  board: any;
  currentTurn: string;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connexion au serveur
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connecté au serveur');
    });

    newSocket.on('game-state-update', (state: GameState) => {
      setGameState(state);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const joinGame = () => {
    if (socket) {
      socket.emit('join-game', 'test-game', 'JoueurTest');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mon Jeu de Plateau</h1>
        <p>Status: {connected ? 'Connecté' : 'Déconnecté'}</p>
        
        <button onClick={joinGame} disabled={!connected}>
          Rejoindre une partie
        </button>

        {gameState && (
          <div>
            <h2>État du jeu</h2>
            <p>Joueurs: {gameState.players.length}</p>
            <p>Tour: {gameState.currentTurn}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;