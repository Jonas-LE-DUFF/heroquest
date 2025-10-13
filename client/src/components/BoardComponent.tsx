import React, { useState } from "react";
import { GameState, Position, tileType } from "../shared/type";
import "./BoardComponent.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { Socket } from "socket.io-client";

interface BoardProps {
  gameState: GameState | null;
  socket: Socket;
  onTileClick: (gameId: string, position: Position) => void;
  selectedType: tileType | null;
}

const Board = ({
  gameState,
  socket,
  onTileClick,
  selectedType,
}: BoardProps) => {
  let [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const handleTileClick = (
    position: Position,
    selectedType: tileType | null
  ) => {
    if (!gameState || !gameState.board[position.x]) {
      console.error("gameState is not defined");
      return;
    }
    const tile = gameState.board[position.x][position.y];
    if (!tile || !socket.id) return;

    const occupantType = tile.type;

    if (occupantType === tileType.monster) {
      if (gameState.players.get(socket.id)?.role !== "game-master") {
        console.log("cant select a monster as hero");
        return;
      }
    }
    if (
      gameState.players.get(socket.id)?.role === "hero" &&
      gameState.currentTurn !== socket.id
    ) {
      console.log("please wait your turn");
      console.log(gameState.players.get(socket.id)?.role);
      return;
    }

    onTileClick(gameState.id, position);

    if (selectedType !== null) {
      return;
    }
    setSelectedPosition(
      selectedPosition?.x === position.x && selectedPosition?.y === position.y
        ? null
        : position
    );
    if (selectedPosition) {
      setSelectedPosition(null);
    }
  };

  const renderGrid = () => {
    const grid = [];
    if (!gameState) {
      console.log("erreur : ", gameState);
      return;
    }
    for (let row = 0; row < gameState.board.length; row++) {
      const cells = [];
      for (let col = 0; col < gameState?.board[row]?.length; col++) {
        const tile: tileType = gameState.board[row]?.[col]?.type;
        if (row === 5 && col === 5) {
        }
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={getTileStyle(row, col)}
            onClick={() => handleTileClick({ x: row, y: col }, selectedType)}
          >
            {tile === tileType.empty ? `${row},${col}` : tileType[tile]}
          </TableCell>
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  const getTileStyle = (x: number, y: number) => {
    const tile = gameState?.board[x]?.[y];
    const isSelected = selectedPosition?.x === x && selectedPosition?.y === y;
    const isMonster = tile?.type === tileType.monster;
    const isHero = tile?.type === tileType.hero;
    const isFurniture = tile?.type === tileType.furniture;
    const isWall = tile?.type === tileType.wall;

    let style = {
      width: 15,
      height: 5,
      border: "1px solid #ccc",
      cursor: "pointer",
      textAlign: "center" as const,
      verticalAlign: "middle" as const,
      padding: "5px 10px 5px 10px",
      backgroundColor: "white",
      borderTop: "0px",
      borderBottom: "0px",
      borderLeft: "0px",
      borderRight: "0px",
    };

    if (isSelected) {
      style = {
        ...style,
        width: 5,
        height: 5,
        backgroundColor: "#4CAF50",
        border: "2px solid #2E7D32",
      };
    }

    if (isHero) {
      style = {
        ...style,
        backgroundColor: "#2196F3",
        border: "2px solid #1976D2",
      };
    }
    if (isMonster) {
      style = {
        ...style,
        backgroundColor: "#F44336",
        border: "2px solid #D32F2F",
      };
    }
    if (isWall) {
      style = {
        ...style,
        backgroundColor: "#4e4e4e93",
        border: "2px solid #201e1eff",
      };
    }
    if (isFurniture) {
      style = {
        ...style,
        backgroundColor: "#583423ff",
        border: "2px solid #422319ff",
      };
    }
    const walls = gameState?.walls;
    if (walls?.horizontal[x][y]) {
      style = {
        ...style,
        borderTop: "4px solid rgba(0,0,0,1)",
      };
    }
    if (walls?.horizontal[x + 1][y]) {
      style = {
        ...style,
        borderBottom: "4px solid rgba(0,0,0,1)",
      };
    }
    if (walls?.vertical[x][y]) {
      style = {
        ...style,
        borderLeft: "4px solid rgba(0,0,0,1)",
      };
    }
    if (walls?.vertical[x][y + 1]) {
      style = {
        ...style,
        borderRight: "4px solid rgba(0,0,0,1)",
      };
    }

    return style;
  };

  return (
    <TableContainer component={Paper} sx={{ width: "fit-content" }}>
      <Typography variant="h6" sx={{ textAlign: "center", padding: 1 }}>
        Plateau de jeu - {gameState?.players.size} joueur(s)
        {selectedPosition &&
          ` - Case sélectionnée: ${selectedPosition.x},${selectedPosition.y}`}
      </Typography>
      <Table>
        <TableBody>{renderGrid()}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default Board;
