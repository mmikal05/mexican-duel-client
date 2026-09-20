import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/theme.css";
import "./styles/components.css";
import "./styles/layout.css";
import "./styles/plots.css";
import "./styles/shop.css";
import "./styles/profile.css";
import "./styles/duel.css";
import { GameProvider } from "./context/GameContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GameProvider>
    <App />
  </GameProvider>
);
