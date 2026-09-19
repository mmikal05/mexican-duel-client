import { io } from "socket.io-client";

// Set VITE_SERVER_URL in client/.env (local) or in your Vercel project settings (deployed).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

// Connected lazily by the Duel screen, so nothing connects on the login page.
export const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

// Secret identity for this browser tab. It is sent to the server so a player
// can be put back into their match after a refresh or dropped connection.
// sessionStorage (not localStorage) so two tabs count as two different players,
// which makes testing PvP on one machine possible.
export const getPlayerToken = () => {
  let token = sessionStorage.getItem("playerToken");

  if (!token) {
    token =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("playerToken", token);
  }

  return token;
};
