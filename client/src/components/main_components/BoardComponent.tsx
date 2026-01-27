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

  const handleTileClick = (
    position: Position,
    selectedType: tileType | Direction | monsterClass | null
  ) => {
    if (!gameState || !gameState.board[position.x]) {
      console.error("gameState is not defined");
      return;
    }
    const tile = gameState.board[position.x][position.y];
    if (!tile || !socket.data.playerId) return;

    if (
      gameState.players.get(socket.data.playerId)?.role === "hero" &&
      gameState.currentTurn !== socket.data.playerId
    ) {
      return;
    }

    onTileClick(gameState.id, position, selectedType);

    if (selectedType !== null) {
      return;
    }
  };

  const renderGrid = () => {
    const grid = [];
    if (!gameState) {
      return;
    }
    for (let row = 0; row < gameState.board.length; row++) {
      const cells = [];
      for (let col = 0; col < gameState?.board[row]?.length; col++) {
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={getTileStyle(
              row,
              col,
              gameState,
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
    const tile: tileType | undefined = gameState?.board[x]?.[y];
    if (!tile) {
      console.error("Tile is undefined at position:", x, y);
      return null;
    }
    const pos: Position = { x: x, y: y };
    const entityId = gameState?.positionEntities.get(positionKey(pos));
    if (!entityId) {
      if (tile === tileType.empty) return `${x},${y}`;
      return tileType[tile];
    }

    let entity: Player | Monster | undefined =
      gameState?.players.get(entityId);
    if (!entity) entity = gameState?.monsters.get(entityId);

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
    console.error("Current GameState:", gameState?.monsters);
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
