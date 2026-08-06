import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { LocationState } from "../../POO/types/LocationType";
import { useLocation } from "react-router-dom";

interface EndTurnButtonProps {
  socket: Socket;
  gameId: string;
  playerId: string;
  className?: string;
}

export const EndTurnButton = ({ socket, className }: EndTurnButtonProps) => {
  const state = useLocation().state as LocationState;
  const { game, playerId } = state;

  const endTurn = () => {
    socket.emit(
      "end-turn",
      { gameId: game.id, playerId },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          toast.error(`Erreur lors de la fin du tour: ${response.error}`);
        }
      },
    );
  };

  return (
    <button className={`warning-button ${className || ""}`} onClick={endTurn}>
      Fin du tour
    </button>
  );
};
