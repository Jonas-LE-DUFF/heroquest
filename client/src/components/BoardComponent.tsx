import { GameState } from "../shared/type";
import "./BoardComponent.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";

interface BoardProps {
  gameState: GameState | null;
}

const Board = ({ gameState }: BoardProps) => {
  const renderGrid = () => {
    const grid = [];
    if (!gameState) {
      console.log("erreur : ", gameState);
      return;
    }
    for (let row = 0; row < gameState.board.length; row++) {
      const cells = [];
      for (let col = 0; col < gameState?.board[row]?.length; col++) {
        const tileType = gameState.board[row]?.[col]?.type || "empty";
        if (row === 5 && col === 5) {
          console.log("row : ", row, "column : ", col, tileType);
        }
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={{
              width: 10,
              height: 10,
              border: "1px solid #ccc",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            {tileType === "empty" ? `${row},${col}` : tileType}
          </TableCell>
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  return (
    <TableContainer component={Paper} sx={{ width: "100%" }}>
      <Table>
        <TableBody>{renderGrid()}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default Board;
