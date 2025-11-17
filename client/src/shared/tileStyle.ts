import { Direction, GameState, Position, tileType } from "./type";

const TILESIZE = 40;

export const getTileStyle = (
  x: number,
  y: number,
  gameState: GameState | null,
  selectedPosition: Position | null
) => {
  const tile = gameState?.board[x]?.[y];
  const isSelected = selectedPosition?.x === x && selectedPosition?.y === y;
  const isMonster = tile?.type === tileType.monster;
  const isHero = tile?.type === tileType.hero;
  const isFurniture = tile?.type === tileType.furniture;
  const isWall = tile?.type === tileType.wall;

  const borderDirectionSet: Direction[] = [];

  const DOOR_BORDER_COLOR = "#523838ff";
  const DOOR_BORDER_WIDTH = "6px";
  const DOOR_CORNER_WIDTH = "4px";

  // "borders" using background images
  const images: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];

  let style: any = {
    alignItems: "center",
    width: TILESIZE,
    height: TILESIZE,
    border: "none",
    cursor: "pointer",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
    boxSizing: "border-box" as const,
    padding: "0px",
    backgroundColor: "white",
    backgroundRepeat: "no-repeat",
  };

  const doors = gameState?.doors;
  // top door -> horizontal[x][y]
  if (doors?.horizontal?.[x]?.[y]) {
    setBorderTop(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // bottom door -> horizontal[x+1][y]
  if (doors?.horizontal?.[x + 1]?.[y]) {
    setBorderBottom(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // left door -> vertical[x][y]
  if (doors?.vertical?.[x]?.[y]) {
    setBorderLeft(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }
  // right door -> vertical[x][y+1]
  if (doors?.vertical?.[x]?.[y + 1]) {
    setBorderRight(DOOR_BORDER_COLOR, DOOR_BORDER_WIDTH);
  }

  if (doors?.horizontal?.[x]?.[y] === false) {
    setAngleTopLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleTopRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.horizontal?.[x + 1]?.[y] === false) {
    setAngleBottomLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.vertical?.[x]?.[y] === false) {
    setAngleTopLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomLeft(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }

  if (doors?.vertical?.[x]?.[y + 1] === false) {
    setAngleTopRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
    setAngleBottomRight(DOOR_BORDER_COLOR, DOOR_CORNER_WIDTH);
  }
  const walls = gameState?.walls;
  // top wall -> horizontal[x][y]
  if (walls?.horizontal?.[x]?.[y]) {
    setBorderTop();
  }
  // bottom wall -> horizontal[x+1][y]
  if (walls?.horizontal?.[x + 1]?.[y]) {
    setBorderBottom();
  }
  // left wall -> vertical[x][y]
  if (walls?.vertical?.[x]?.[y]) {
    setBorderLeft();
  }
  // right wall -> vertical[x][y+1]
  if (walls?.vertical?.[x]?.[y + 1]) {
    setBorderRight();
  }

  if (isSelected) {
    setBorderAllSides("#3f7a41ff");

    style = {
      ...style,
      backgroundColor: "#4CAF50",
    };
  }

  if (isHero) {
    setBorderAllSides("#174ea6ff");
    style = {
      ...style,
      backgroundColor: "#2196F3",
    };
  }
  if (isMonster) {
    setBorderAllSides("#a73027ff");
    style = {
      ...style,
      backgroundColor: "#F44336",
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
    width: string = "6px"
  ) {
    images.push(`linear-gradient(${color}, ${color})`);
    sizes.push(`${width} ${width}`);
    positions.push("right bottom");
  }
  function setAngleBottomLeft(
    color: string = "#8B4513",
    width: string = "6px"
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
