import MenuItem from "@mui/material/MenuItem";
import { FurniturePreview } from "../components/main_components/BoardComponent";
import { Direction } from "../POO/enums/Direction";
import { PositionAsJson } from "../POO/interfaces/ClassAsJson/PositionAsJson";
import furnitures from "./game_cards/furnitures.json";

export function isFurniturePlacementValid(
  hoveredTile: PositionAsJson,
  furnitureData: {
    furnitureId: string;
    furnitureName: string;
    imagePath: string;
    length: number;
    width: number;
  },
  furniturePreview: FurniturePreview,
  boardWidth: number,
  boardHeight: number,
): boolean {
  if (
    furniturePreview.direction === Direction.RIGHT &&
    (hoveredTile.x + furnitureData.width - 1 >= boardWidth ||
      hoveredTile.y + furnitureData.length - 1 >= boardHeight)
  ) {
    return false;
  }
  if (
    furniturePreview.direction === Direction.DOWN &&
    (hoveredTile.y - furnitureData.width + 1 < 0 ||
      hoveredTile.x + furnitureData.length - 1 >= boardWidth)
  ) {
    return false;
  }
  if (
    furniturePreview.direction === Direction.LEFT &&
    (hoveredTile.x - furnitureData.width + 1 < 0 ||
      hoveredTile.y - furnitureData.length + 1 < 0)
  ) {
    return false;
  }
  if (
    furniturePreview.direction === Direction.UP &&
    (hoveredTile.x - furnitureData.length + 1 < 0 ||
      hoveredTile.y + furnitureData.width - 1 >= boardHeight)
  ) {
    return false;
  }

  return true;
}

export function getFurnituresAsMenuItems() {
  const furnituresSorted = furnitures.sort(
    (a, b) =>
      a.length - b.length ||
      a.width - b.width ||
      a.furnitureName.localeCompare(b.furnitureName),
  );

  return furnituresSorted.map((furniture) => (
    <MenuItem
      key={furniture.furnitureId}
      value={furniture.furnitureId}
      sx={{ justifyContent: "center" }}
    >
      <img
        style={{
          width: "auto",
          height: "auto",
          maxHeight: `${100 * furniture.width}px`,
          maxWidth: `${33 * furniture.length}px`,
        }}
        src={furniture.imagePath}
        alt={furniture.furnitureName}
      />
    </MenuItem>
  ));
}
