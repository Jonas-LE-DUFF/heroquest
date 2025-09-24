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
  rows: number;
  columns: number;
}

const Board = ({ rows, columns }: BoardProps) => {
  const renderGrid = () => {
    const grid = [];

    for (let row = 0; row < rows; row++) {
      const cells = [];
      for (let col = 0; col < columns; col++) {
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
            {row},{col}
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
