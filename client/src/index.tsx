import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./fonts.css";
import App from "./App";
import { createTheme } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: "dumbledor, sans-serif",
    fontSize: 16,
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: "dumbledor, sans-serif",
          fontSize: "1.25rem",
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

export default theme;
