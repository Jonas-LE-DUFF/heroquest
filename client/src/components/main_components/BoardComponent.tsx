import { useEffect, useState } from "react";
import {
  Direction,
  GameState,
  Monster,
  monsterClass,
  Player,
  Position,
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
  getIconClassPath,
  getUnitClassName,
  positionKey,
} from "../../shared/utils";
import { getTileStyle } from "../../shared/tileStyle";

interface BoardProps {
  gameState: GameState | null;
  socket: Socket;
  onTileClick: (
    gameId: string,
    position: Position,
    selectedType: tileType | Direction | monsterClass | null
  ) => void;
  selectedPosition: Position | null;
  selectedEntityId: string | null;
  selectedType: tileType | Direction | monsterClass | null;
}

const Board = ({
  gameState,
  socket,
  onTileClick,
  selectedPosition,
  selectedEntityId,
  selectedType,
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
    selectedType: tileType | Direction | monsterClass | null
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

    onTileClick(localGameState.id, position, selectedType);

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
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={getTileStyle(
              row,
              col,
              localGameState,
              selectedPosition ?? selectedEntityId
            )}
            onClick={() => handleTileClick({ x: row, y: col }, selectedType)}
          >
            {getTileContent(row, col)}
          </TableCell>
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  const getTileContent = (x: number, y: number) => {
    const tile: tileType | undefined = localGameState?.board[x]?.[y];
    if (!tile) {
      console.error("Tile is undefined at position:", x, y);
      return null;
    }
    const pos: Position = { x: x, y: y };
    const entityId = localGameState?.positionEntities.get(positionKey(pos));
    if (!entityId) {
      if (tile === tileType.empty) return `${x},${y}`;
      return tileType[tile];
    }

    let entity: Player | Monster | undefined =
      localGameState?.players.get(entityId);
    if (!entity) entity = localGameState?.monsters.get(entityId);

    if (entity && entity.class) {
      return (
        <img
          className="boardImg"
          src={getIconClassPath(entity)}
          alt={getUnitClassName(entity)}
        />
      );
    }

    console.error("Entity not found for id:", entityId);
    console.error("Current GameState:", localGameState?.monsters);
    console.log(typeof entity);
    console.log(entity);
    return tileType[tile];
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
