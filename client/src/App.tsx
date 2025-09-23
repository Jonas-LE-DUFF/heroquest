import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import "./App.css";
import { wait } from "@testing-library/user-event/dist/utils";
import { eventNames } from "process";

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnected(true);
      console.log("Connecté au serveur");
    });

    return () => {
      newSocket.close();
    };
  }, []);

  function handleJoinGame() {
    setPending(true);
    wait(30000);
    const playerName = (
      document.getElementById("playerName") as HTMLInputElement
    ).value;
    const gameId = (document.getElementById("gameId") as HTMLInputElement)
      .value;
    if (socket) {
      socket.emit("join-game", gameId, playerName);
    }
    setPending(false);
  }

  function isButtonDisabled() {
    return !pending && (playerName.trim() === "" || gameId.trim() === "");
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hero Quest</h1>
        <p>Status: {connected ? "Connecté" : "Déconnecté"}</p>
        <form action={handleJoinGame}>
          <input
            onChange={(event) => setPlayerName(event.target.value)}
            id="playerName"
            type="text"
            placeholder="Nom du joueur"
            content={playerName}
          />
          <input
            onChange={(event) => setGameId(event.target.value)}
            id="gameId"
            type="text"
            placeholder="ID de la partie"
            content={gameId}
          />
          <button type="submit" disabled={isButtonDisabled()}>
            {pending ? "Chargement ..." : "Rejoindre une partie"}
          </button>
        </form>
      </header>
    </div>
  );
}

export default App;
