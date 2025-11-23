import React, { useEffect, useState } from "react";
import {
  Direction,
  GameState,
  heroClass,
  Monster,
  monsterClass,
  Player,
  Position,
  Tile,
  tileType,
} from "../../shared/type";
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
} from "../../shared/utils";
import { getTileStyle } from "../../shared/tileStyle";

interface BoardProps {
  gameState: GameState | null;
  socket: Socket;
  onTileClick: (
    gameId: string,
    position: Position,
    monsterType: monsterClass | null
  ) => void;
  selectedPosition: Position | null;
  selectedEntityId: string | null;
  selectedType: tileType | Direction | null;
  monsterType: monsterClass | null;
}

const Board = ({
  gameState,
  socket,
  onTileClick,
  selectedPosition,
  selectedEntityId,
  selectedType,
  monsterType,
}: BoardProps) => {
  const [localGameState, setLocalGameState] = useState<GameState | null>(
    gameState
  );

  useEffect(() => {
    setLocalGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    const onDoorPlaced = (data: {
      position: Position;
      verticalOrHorizontal: "vertical" | "horizontal";
    }) => {
      setLocalGameState((prev) => {
        if (!prev) return prev;
        const newState: GameState = {
          ...prev,
          doors: {
            horizontal: prev.doors.horizontal.map((row) =>
              row ? [...row] : []
            ),
            vertical: prev.doors.vertical.map((row) => (row ? [...row] : [])),
          },
        };

        if (data.verticalOrHorizontal === "horizontal") {
          const row = newState.doors.horizontal[data.position.x] ?? [];
          row[data.position.y] = true;
          newState.doors.horizontal[data.position.x] = row;
        } else if (data.verticalOrHorizontal === "vertical") {
          const row = newState.doors.vertical[data.position.x] ?? [];
          row[data.position.y] = true;
          newState.doors.vertical[data.position.x] = row;
        }

        return newState;
      });
    };

    socket.on("door-placed", onDoorPlaced);
    return () => {
      socket.off("door-placed", onDoorPlaced);
    };
  }, [socket]);

  useEffect(() => {}, [gameState]);

  const handleTileClick = (
    position: Position,
    selectedType: tileType | Direction | null,
    monsterType: monsterClass | null
  ) => {
    if (!localGameState || !localGameState.board[position.x]) {
      console.error("gameState is not defined");
      return;
    }
    const tile = localGameState.board[position.x][position.y];
    if (!tile || !socket.id) return;

    if (
      localGameState.players.get(socket.id)?.role === "hero" &&
      localGameState.currentTurn !== socket.id
    ) {
      return;
    }

    onTileClick(localGameState.id, position, monsterType);

    if (selectedType !== null) {
      return;
    }
  };

  const renderGrid = () => {
    const grid = [];
    if (!localGameState) {
      return;
    }
    for (let row = 0; row < localGameState.board.length; row++) {
      const cells = [];
      for (let col = 0; col < localGameState?.board[row]?.length; col++) {
        const tile: tileType = localGameState.board[row]?.[col]?.type;
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={getTileStyle(row, col, localGameState, selectedEntityId)}
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
    const tile: Tile | undefined = localGameState?.board[x]?.[y];
    if (!tile) return null;
    const pos: Position = { x: x, y: y };
    const entityId = localGameState?.positionEntities.get(positionKey(pos));
    if (!entityId) return tileType[tile.type];

    const entityPlayer: Player | undefined =
      localGameState?.players.get(entityId);
    const entityMonster: Monster | undefined =
      localGameState?.monsters.get(entityId);

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
