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
import { getIconClassPath, getUnitClassName } from "../../shared/utils";
import { getTileStyle } from "../../shared/tileStyle";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { TileAsJson } from "../../POO/interfaces/ClassAsJson/Board/TileAsJson";
import { Direction } from "../../POO/enums/Direction";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { useLocation } from "react-router-dom";
import { getPlayerIdToPlay } from "../../shared/serverUtils";
import { TileType } from "../../POO/enums/TileType";
import { PlayerRole } from "../../POO/enums/PlayerRole";

interface BoardProps {
  socket: Socket;
  game: GameAsJson;
  onTileClick: (
    gameId: string,
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
  ) => void;
  selectedPosition: PositionAsJson | null;
  selectedEntityId: string | null;
  selectedType: TileType | Direction | MonsterCategory | null;
}

const Board = ({
  socket,
  game,
  onTileClick,
  selectedPosition,
  selectedEntityId,
  selectedType,
}: BoardProps) => {
  const location = useLocation();
  const role = location.state.role;

  const handleTileClick = (
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
  ) => {
    if (!game || !game.gameState.board.tiles[position.x]) {
      console.error("gameState is not defined");
      return;
    }
    const tile = game.gameState.board.tiles[position.x][position.y];
    if (!tile || !socket.id) return;

    if (role === PlayerRole.HERO && getPlayerIdToPlay(game) !== socket.id) {
      return;
    }

    onTileClick(game.id, position, selectedType);

    if (selectedType !== null) {
      return;
    }
  };

  const renderGrid = () => {
    const grid = [];
    if (!game) {
      return;
    }
    for (let row = 0; row < game.gameState.board.tiles.length; row++) {
      const cells = [];
      for (let col = 0; col < game.gameState.board.tiles[row].length; col++) {
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={getTileStyle(
              row,
              col,
              game.gameState,
              selectedPosition ?? selectedEntityId,
            )}
            onClick={() => handleTileClick({ x: row, y: col }, selectedType)}
          >
            {getTileContent(row, col)}
          </TableCell>,
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  const getTileContent = (x: number, y: number) => {
    const tile: TileAsJson | undefined = game.gameState.board.tiles[x]?.[y];
    if (!tile) {
      console.error("Tile is undefined at position:", x, y);
      return null;
    }
    const pos: PositionAsJson = { x: x, y: y };
    const unit = tile.unit;
    if (!unit) {
      if (tile.type === TileType.FLOOR) return `${x},${y}`;
      return TileType[tile.type];
    }

    return (
      <img
        className="boardImg"
        src={getIconClassPath(unit)}
        alt={getUnitClassName(unit)}
      />
    );
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
