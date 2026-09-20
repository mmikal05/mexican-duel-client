import { useEffect } from "react";
import { socket, getPlayerToken } from "../socket";

// Runs for the whole session. After a page refresh (or a dropped connection)
// the player lands on the profile page, so if the server says they still have a
// duel going, or a result waiting to be collected, take them back to the Duel
// screen. The Duel screen itself then restores the fight or shows the result.
export default function useResumeDuel(onNavigate) {
  useEffect(() => {
    const token = getPlayerToken();
    const ask = () => socket.emit("reconnectPlayer", { token });
    const goToDuel = () => onNavigate("duel");

    socket.on("connect", ask);
    socket.on("reconnected", goToDuel);
    socket.on("matchOver", goToDuel);

    if (socket.connected) ask();
    else socket.connect();

    return () => {
      socket.off("connect", ask);
      socket.off("reconnected", goToDuel);
      socket.off("matchOver", goToDuel);
    };
  }, [onNavigate]);
}
