import { Direction } from "../POO/enums/Direction";
import { TileType } from "../POO/enums/Board/TileType";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import { GameStateAsJson } from "../POO/interfaces/ClassAsJson/Server/GameStateAsJson";
import { getTileByPosition } from "./boardUtils";

const TILESIZE = "40px";

interface TileStyle {
  alignItems: string;
  width: string;
  height: string;
  border: string;
  textAlign: "center";
  verticalAlign: "middle";
  boxSizing: "border-box";
  padding: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  position: "relative";
  overflow: "visible";
}

export const getTileStyle = (
  x: number,
  y: number,
  gameState: GameStateAsJson,
  selection: PositionAsJson | null,
) => {
  const tile = getTileByPosition({ x, y }, gameState.board);

  const isSelected = x === selection?.x && y === selection?.y;

  const isFurniture = tile?.type === TileType.FURNITURE;
  const isWall = tile?.type === TileType.WALL;

  const borderDirectionSet: Direction[] = [];

  const DOOR_BORDER_COLOR = "#523838ff";
  const DOOR_BORDER_WIDTH = "6px";
  const DOOR_CORNER_WIDTH = "4px";

  // "borders" using background images
  const images: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];

  let style: TileStyle = {
    alignItems: "center",
    width: TILESIZE,
    height: TILESIZE,
    border: "none",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    boxSizing: "border-box" as const,
    padding: "0px",
    backgroundColor: "white",
    backgroundRepeat: "no-repeat",
    position: "relative" as const,
    overflow: "visible",
  };

  const doors = gameState.board.doors;
  // top door -> horizontal[x][y]
  if (doors?.horizontalDoors?.[x]?.[y]) {
    setBorderTop(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // bottom door -> horizontal[x+1][y]
  if (doors?.horizontalDoors?.[x + 1]?.[y]) {
    setBorderBottom(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // left door -> vertical[x][y]
  if (doors?.verticalDoors?.[x]?.[y]) {
    setBorderLeft(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // right door -> vertical[x][y+1]
  if (doors?.verticalDoors?.[x]?.[y + 1]) {
    setBorderRight(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }

  if (doors?.horizontalDoors?.[x]?.[y] === false) {
    setAngleTopLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleTopRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.horizontalDoors?.[x + 1]?.[y] === false) {
    setAngleBottomLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.verticalDoors?.[x]?.[y] === false) {
    setAngleTopLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.verticalDoors?.[x]?.[y + 1] === false) {
    setAngleTopRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }
  const walls = gameState.board.walls;
  // top wall -> horizontal[x][y]
  if (walls?.horizontalWalls?.[x]?.[y]) {
    setBorderTop();
  }
  // bottom wall -> horizontal[x+1][y]
  if (walls?.horizontalWalls?.[x + 1]?.[y]) {
    setBorderBottom();
  }
  // left wall -> vertical[x][y]
  if (walls?.verticalWalls?.[x]?.[y]) {
    setBorderLeft();
  }
  // right wall -> vertical[x][y+1]
  if (walls?.verticalWalls?.[x]?.[y + 1]) {
    setBorderRight();
  }

  if (isSelected) {
    setBorderAllSides("#3f7a41ff");

    style = {
      ...style,
      backgroundColor: "#4CAF50",
    };
  }

  if (isWall) {
    setBorderAllSides("#464241ff");
    style = {
      ...style,
      backgroundColor: "#4e4e4e93",
    };
  }
  if (isFurniture) {
    setBorderAllSides("#3e2723ff");
    style = {
      ...style,
      backgroundColor: "#583423ff",
    };
  }
  if (isSelected) {
    style = {
      ...style,
      backgroundColor: "#4CAF50",
    };
  }
  setMissingBorders("rgba(153, 143, 143, 0.51)");

  style.backgroundImage = images.join(", ");
  style.backgroundSize = sizes.join(", ");
  style.backgroundPosition = positions.join(", ");
  style.backgroundRepeat = "no-repeat";

  return style;

  function setBorderRight(color: string = "black", width: string = "2px") {
    borderDirectionSet.push(Direction.RIGHT);
    images.push(`linear-gradient(to bottom, ${color} 0 100%)`);
    sizes.push(`${width} 100%`);
    positions.push("top right");
  }

  function setBorderLeft(color: string = "black", width: string = "2px") {
    borderDirectionSet.push(Direction.LEFT);
    images.push(`linear-gradient(to bottom, ${color} 0 100%)`);
    sizes.push(`${width} 100%`);
    positions.push("top left");
  }

  function setBorderBottom(color: string = "black", width: string = "2px") {
    borderDirectionSet.push(Direction.DOWN);
    images.push(`linear-gradient(to right, ${color} 0 100%)`);
    sizes.push(`100% ${width}`);
    positions.push("bottom left");
  }

  function setBorderTop(color: string = "black", width: string = "2px") {
    borderDirectionSet.push(Direction.UP);
    images.push(`linear-gradient(to right, ${color} 0 100%)`);
    sizes.push(`100% ${width}`);
    positions.push("top left");
  }

  function setAngleTopLeft(color: string = "#8B4513", width: string = "6px") {
    images.push(`linear-gradient(${color}, ${color})`);
    sizes.push(`${width} ${width}`);
    positions.push("left top");
  }
  function setAngleTopRight(color: string = "#8B4513", width: string = "6px") {
    images.push(`linear-gradient(${color}, ${color})`);
    sizes.push(`${width} ${width}`);
    positions.push("right top");
  }
  function setAngleBottomRight(
    color: string = "#8B4513",
    width: string = "6px",
  ) {
    images.push(`linear-gradient(${color}, ${color})`);
    sizes.push(`${width} ${width}`);
    positions.push("right bottom");
  }
  function setAngleBottomLeft(
    color: string = "#8B4513",
    width: string = "6px",
  ) {
    images.push(`linear-gradient(${color}, ${color})`);
    sizes.push(`${width} ${width}`);
    positions.push("left bottom");
  }

  function setBorderAllSides(color: string, width: string = "2px") {
    setBorderTop(color, width);
    setBorderBottom(color, width);
    setBorderLeft(color, width);
    setBorderRight(color, width);
  }

  function setMissingBorders(color: string, width: string = "1px") {
    if (!borderDirectionSet.includes(Direction.UP)) {
      setBorderTop(color, width);
    }
    if (!borderDirectionSet.includes(Direction.RIGHT)) {
      setBorderRight(color, width);
    }
    if (!borderDirectionSet.includes(Direction.DOWN)) {
      setBorderBottom(color, width);
    }
    if (!borderDirectionSet.includes(Direction.LEFT)) {
      setBorderLeft(color, width);
    }
  }
};
