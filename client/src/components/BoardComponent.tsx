import React, { useState } from "react";
import {
  GameState,
  heroClass,
  Monster,
  monsterClass,
  Player,
  Position,
  Tile,
  tileType,
} from "../shared/type";
import "./BoardComponent.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import { Socket } from "socket.io-client";
import {
  getHeroClassIconPath,
  getMonsterIconPath,
  positionKey,
} from "../shared/utils";
import { getTileStyle } from "../shared/tileStyle";

interface BoardProps {
  gameState: GameState | null;
  socket: Socket;
  onTileClick: (
    gameId: string,
    position: Position,
    monsterType: monsterClass | null
  ) => void;
  selectedType: tileType | null;
  monsterType: monsterClass | null;
}

const Board = ({
  gameState,
  socket,
  onTileClick,
  selectedType,
  monsterType,
}: BoardProps) => {
  let [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const handleTileClick = (
    position: Position,
    selectedType: tileType | null,
    monsterType: monsterClass | null
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

    onTileClick(gameState.id, position, monsterType);

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
            sx={getTileStyle(row, col, gameState, selectedPosition)}
            onClick={() =>
              handleTileClick({ x: row, y: col }, selectedType, monsterType)
            }
          >
            {tile !== tileType.empty && getTileContent(row, col)}
          </TableCell>
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  const getTileContent = (x: number, y: number) => {
    const tile: Tile | undefined = gameState?.board[x]?.[y];
    if (!tile) return null;
    const pos: Position = { x: x, y: y };
    const entityId = gameState?.positionEntities.get(positionKey(pos));
    if (!entityId) return tileType[tile.type];

    const entityPlayer: Player | undefined = gameState?.players.get(entityId);
    const entityMonster: Monster | undefined =
      gameState?.monsters.get(entityId);

    if (entityPlayer && entityPlayer.class) {
      return (
        <img
          className="boardImg"
          src={getHeroClassIconPath(entityPlayer.class)}
          alt={heroClass[entityPlayer.class]}
        />
      );
    }
    if (entityMonster && entityMonster.class) {
      return (
        <img
          className="boardImg"
          src={getMonsterIconPath(entityMonster.class)}
          alt={monsterClass[entityMonster.class]}
        />
      );
    }
    console.log("tile type returned  : ", tileType[tile.type]);

    return tileType[tile.type];
  };

  return (
    <TableContainer component={Paper} sx={{ width: "fit-content" }}>
      <Table>
        <TableBody>{renderGrid()}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default Board;
