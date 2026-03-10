import "./BoardComponent.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import { getIconClassPath, getUnitClassName } from "../../shared/utils";
import { getTileStyle } from "../../shared/tileStyle";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { TileAsJson } from "../../POO/interfaces/ClassAsJson/Board/TileAsJson";
import { Direction } from "../../POO/enums/Direction";
import { MonsterCategory } from "../../POO/enums/Categories/MonsterCategory";
import { TileType } from "../../POO/enums/TileType";
import StairsImage from "/assets/images/icons/Tiles/stairs.png";
import { JSX } from "react/jsx-runtime";

interface BoardProps {
  game: GameAsJson;
  onTileClick: (
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
  ) => void;
  selectedPosition: PositionAsJson | null;
  selectedEntityId: string | null;
  selectedType: TileType | Direction | MonsterCategory | null;
}

const Board = ({
  game,
  onTileClick,
  selectedPosition,
  selectedEntityId,
  selectedType,
}: BoardProps) => {
  const handleTileClick = (
    position: PositionAsJson,
    selectedType: TileType | Direction | MonsterCategory | null,
  ) => {
    if (!game || !game.gameState.board.tiles[position.x]) {
      console.error("gameState is not defined");
      return;
    }

    onTileClick(position, selectedType);
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
    const unit = game.gameState.Units.find((u) => u.id === tile.unitId);
    const elements: JSX.Element[] = [];
    if (!unit) {
      if (tile.type === TileType.FLOOR) return `${x},${y}`;
    }
    if (tile.type === TileType.SPAWN_POINT) {
      const upperTile = game.gameState.board.tiles[x - 1]?.[y];
      const leftTile = game.gameState.board.tiles[x]?.[y - 1];
      if (
        !(
          upperTile?.type === TileType.SPAWN_POINT ||
          leftTile?.type === TileType.SPAWN_POINT
        )
      ) {
        elements.push(
          <img className="stairsImage" src={StairsImage} alt="Stairs" />,
        );
      }
    }

    if (unit) {
      elements.push(
        <img
          className="boardImg"
          src={getIconClassPath(unit)}
          alt={getUnitClassName(unit)}
        />,
      );
    }

    return <div>{elements}</div>;
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
