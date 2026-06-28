import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/farm.css";
import "./styles/forest.css";
import "./styles/mine.css";
import "./styles/shed.css";
import "./styles/duel.css";
import { GameProvider } from "./context/GameContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GameProvider>
    <App />
  </GameProvider>
);