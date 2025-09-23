import "./Board.css";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";

interface BoardProps {
  size: number;
}

const Board = ({ size }: BoardProps) => {
  const renderGrid = () => {
    const grid = [];

    for (let row = 0; row < size; row++) {
      const cells = [];
      for (let col = 0; col < size; col++) {
        cells.push(
          <TableCell
            key={col}
            className="tile"
            sx={{
              width: 50,
              height: 50,
              border: "1px solid #ccc",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            {row},{col}
          </TableCell>
        );
      }
      grid.push(<TableRow key={row}>{cells}</TableRow>);
    }

    return grid;
  };

  return (
    <TableContainer component={Paper} sx={{ maxWidth: "fit-content" }}>
      <Table>
        <TableBody>{renderGrid()}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default Board;
