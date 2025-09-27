import React, { useState } from "react";
import { GameState, Position, tileType } from "../shared/type";
import { getPlayerRole } from "../shared/util";
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
    const tile = gameState?.board[position.x]?.[position.y];
    if (!tile) return;

    // Vérifier si la case est occupée
    const occupantType = tile.type;

    // Vérifier si l'occupant appartient au joueur actuel
    if (occupantType === tileType.monster) {
      if (getPlayerRole(gameState, socket.id) !== "game-master") {
        console.log("cant select a monster as hero");
        return;
      }
    }
    if (
      getPlayerRole(gameState, socket.id) === "hero" &&
      gameState.currentTurn !== socket.id
    ) {
      console.log("please wait your turn");
      console.log(getPlayerRole(gameState, socket.id));
      return;
    }

    // Émettre l'événement avec les informations
    onTileClick(gameState.id, position);

    if (selectedType !== null) {
      return;
    }

    // Gestion de la sélection visuelle

    // Sélectionner/déselectionner une unité du joueur
    setSelectedPosition(
      selectedPosition?.x === position.x && selectedPosition?.y === position.y
        ? null
        : position
    );
    if (selectedPosition) {
      // Déjà une unité sélectionnée, tentative de mouvement/action
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

    const baseStyle = {
      width: 15,
      height: 5,
      border: "1px solid #ccc",
      cursor: "pointer",
      textAlign: "center" as const,
      verticalAlign: "middle" as const,
      padding: "5px 10px 5px 10px",
    };

    if (isSelected) {
      return {
        ...baseStyle,
        width: 5,
        height: 5,
        backgroundColor: "#4CAF50",
        border: "2px solid #2E7D32",
      };
    }

    if (isHero) {
      return {
        ...baseStyle,
        backgroundColor: "#2196F3",
        border: "2px solid #1976D2",
      };
    }
    if (isMonster) {
      return {
        ...baseStyle,
        backgroundColor: "#F44336",
        border: "2px solid #D32F2F",
      };
    }
    if (isWall) {
      return {
        ...baseStyle,
        backgroundColor: "#4e4e4e93",
        border: "2px solid #201e1eff",
      };
    }
    if (isFurniture) {
      return {
        ...baseStyle,
        backgroundColor: "#583423ff",
        border: "2px solid #422319ff",
      };
    }

    return {
      ...baseStyle,
      backgroundColor: tile?.revealed ? "#F5F5F5" : "#7b7a7cff",
      "&:hover": { backgroundColor: "#E0E0E0" },
    };
  };

  return (
    <TableContainer component={Paper} sx={{ width: "fit-content" }}>
      <Typography variant="h6" sx={{ textAlign: "center", padding: 1 }}>
        Plateau de jeu - {gameState?.players.values.length} joueur(s)
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
