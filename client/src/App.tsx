import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { io, Socket } from "socket.io-client";
import LoginPage from "./components/LoginPage";
import LobbyPage from "./components/LobbyPage";
import GamePage from "./components/GamePage";
import "./App.css";

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) {
    return <div>Connexion au serveur...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage socket={socket} />} />
          <Route path="/lobby" element={<LobbyPage socket={socket} />} />
          <Route path="/game" element={<GamePage socket={socket} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
