import { Tile } from "../Tile";
import { BoardInitializer } from "./BoardInitializer";
import { DoorGrid } from "./DoorGrid";
import { WallGrid } from "./WallGrid";

class Board {
    Map: Tile[][];
    Walls: WallGrid;
    Doors: DoorGrid;

    constructor() {
        this.Map = BoardInitializer.initializeBoard();
        this.Walls = BoardInitializer.initializeWalls();
        this.Doors = BoardInitializer.initializeDoors();
    }
}

export { Board };