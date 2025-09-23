import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connecté au serveur');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hero Quest</h1>
        <p>Status: {connected ? 'Connecté' : 'Déconnecté'}</p>
        <button onClick={() => socket?.emit('join-game', 'test-game', 'JoueurTest')}>
          Rejoindre une partie
        </button>
      </header>
    </div>
  );
}

export default App;