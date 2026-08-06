import "./BoardComponent.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";
import { useState } from "react";
import type { JSX } from "react";
import {
  getIconClassPath,
  getUnitClassName,
  getTrapTypePath,
  isHero,
} from "../../shared/utils";
import { getTileStyle } from "../../shared/tileStyle";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";
import { PositionAsJson } from "../../POO/interfaces/ClassAsJson/PositionAsJson";
import { TileAsJson } from "../../POO/interfaces/ClassAsJson/Board/Tile/TileAsJson";
import { TileType } from "../../POO/enums/Board/TileType";
import StairsImage from "/assets/images/icons/Tiles/stairs.png";
import { SelectType } from "../../POO/types/selectType";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import furnituresJson from "../../shared/game_cards/furnitures.json";
import { Direction } from "../../POO/enums/Direction";
import { isFurniturePlacementValid } from "../../shared/furnitureUtils";

export interface FurniturePreview {
  furnitureType: string;
  direction: Direction;
}

interface BoardProps {
  game: GameAsJson;
  onTileClick: (position: PositionAsJson, selectedType: SelectType) => void;
  selectedPosition: PositionAsJson | null;
  selectedType: SelectType;
  furniturePreview?: FurniturePreview | null;
}

const Board = ({
  game,
  onTileClick,
  selectedPosition,
  selectedType,
  furniturePreview = null,
}: BoardProps) => {
  const [hoveredTile, setHoveredTile] = useState<PositionAsJson | null>(null);

  const handleTileClick = (
    position: PositionAsJson,
    selectedType: SelectType,
  ) => {
    if (!game || !game.gameState.board.tiles[position.x]) {
      console.error("gameState is not defined");
      return;
    }

    onTileClick(position, selectedType);
  };

  function getTileContent(x: number, y: number) {
    const tile: TileAsJson | undefined = game.gameState.board.tiles[x]?.[y];
    if (!tile) {
      console.error("Tile is undefined at position:", x, y);
      return null;
    }
    const unit = game.gameState.Units.find((u) => u.id === tile.unitId);
    const furniture = game.gameState.board.furnitures.find((f) => {
      return f.position.x === x && f.position.y === y;
    });

    const elements: JSX.Element[] = [];

    if (tile.trap?.type) {
      elements.push(
        <img
          className="boardImg"
          src={getTrapTypePath(tile.trap.type)}
          alt={tile.trap.type}
        />,
      );
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

    if (furniture) {
      const furnitureData = furnituresJson.find(
        (f) => f.furnitureId === furniture.furnitureType,
      );
      const rotation =
        furniture.direction === Direction.RIGHT
          ? 0
          : furniture.direction === Direction.DOWN
            ? 90
            : furniture.direction === Direction.LEFT
              ? 180
              : 270;
      if (!furnitureData) {
        console.error(
          `Furniture data not found for ID: ${furniture.furnitureType}`,
        );
        return null;
      }
      elements.push(
        <img
          style={{
            transform: `rotate(${rotation}deg) translate(2px, 2px)`,
            transformOrigin: "20px 20px",
            width: `${furnitureData.length * 40 - 4}px`,
            height: `${furnitureData.width * 40 - 4}px`,
            position: "absolute",
            display: "block",
            top: "0",
            left: "0",
            zIndex: 1,
          }}
          src={furnitureData.imagePath}
          alt={furnitureData.furnitureName}
        />,
      );
    }

    if (unit) {
      let className = "boardImg";
      if (tile.type !== TileType.FLOOR || furniture) {
        className += " onTopImage";
      }
      if (tile.trap && !isInPitTrap(unit)) {
        className += " onTopImage";
      }
      if (isInPitTrap(unit)) {
        className += " inPitTrap";
      }

      elements.push(
        <img
          className={className}
          src={getIconClassPath(unit)}
          alt={getUnitClassName(unit)}
        />,
      );
    }

    if (tile.transientUnitId) {
      const transientUnit = game.gameState.Units.find(
        (u) => u.id === tile.transientUnitId,
      );
      if (transientUnit) {
        let className = "boardImg";
        if (tile.type !== TileType.FLOOR || unit) {
          className += " onTopImage";
        }
        elements.push(
          <img
            className={className}
            src={getIconClassPath(transientUnit)}
            alt={getUnitClassName(transientUnit)}
          />,
        );
      }
    }

    if (elements.length === 0) {
      return `${x},${y}`;
    }
    return <div>{elements}</div>;
  }

  function getFurniturePreviewContent() {
    if (!hoveredTile || !furniturePreview) {
      return null;
    }

    const furnitureData = furnituresJson.find(
      (f) => f.furnitureId === furniturePreview.furnitureType,
    );

    if (!furnitureData) {
      return null;
    }

    const boardWidth = game.gameState.board.tiles.length;
    const boardHeight = game.gameState.board.tiles[0].length;

    if (
      !isFurniturePlacementValid(
        hoveredTile,
        furnitureData,
        furniturePreview,
        boardWidth,
        boardHeight,
      )
    ) {
      return null;
    }

    const rotation =
      furniturePreview.direction === Direction.RIGHT
        ? 0
        : furniturePreview.direction === Direction.DOWN
          ? 90
          : furniturePreview.direction === Direction.LEFT
            ? 180
            : 270;

    return (
      <img
        className="furniturePreview"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "20px 20px",
          width: `${furnitureData.length * 40 - 4}px`,
          height: `${furnitureData.width * 40 - 4}px`,
        }}
        src={furnitureData.imagePath}
        alt={furnitureData.furnitureName}
      />
    );
  }

  const grid: JSX.Element[] = [];
  for (let row = 0; row < game.gameState.board.tiles.length; row++) {
    const cells = [];
    for (let col = 0; col < game.gameState.board.tiles[row].length; col++) {
      const isHovered = hoveredTile?.x === row && hoveredTile?.y === col;
      cells.push(
        <TableCell
          key={col}
          className="tile"
          sx={getTileStyle(row, col, game, selectedPosition)}
          onClick={() => handleTileClick({ x: row, y: col }, selectedType)}
          onMouseEnter={() => setHoveredTile({ x: row, y: col })}
          onMouseLeave={() => {
            if (isHovered) {
              setHoveredTile(null);
            }
          }}
        >
          {isHovered ? getFurniturePreviewContent() : null}
          {getTileContent(row, col)}
        </TableCell>,
      );
    }
    grid.push(<TableRow key={row}>{cells}</TableRow>);
  }

  return (
    <TableContainer component={Paper} sx={{ width: "fit-content" }}>
      <Table>
        <TableBody>{grid}</TableBody>
      </Table>
    </TableContainer>
  );
};

function isInPitTrap(unit: MonsterAsJson | HeroAsJson): boolean {
  if (!isHero(unit)) return false;
  return unit.stats.effects.some((effect) => effect === "Pit Trap");
}

export default Board;
