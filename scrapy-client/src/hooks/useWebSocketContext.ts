import { WebSocketContext } from "@/providers/WebSocketProvider";
import { useContext } from "react";

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider",
    );
  }
  return context;
}
