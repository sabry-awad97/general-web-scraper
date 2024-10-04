import { WebSocketContext } from "@/contexts/ws";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ReactNode } from "react";

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const webSocketValue = useWebSocket(url);

  return (
    <WebSocketContext.Provider value={webSocketValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
