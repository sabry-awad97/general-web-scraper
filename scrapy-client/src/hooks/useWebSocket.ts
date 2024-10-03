import { MessageType, WebSocketMessage } from "@/types";
import { useCallback, useState } from "react";
import useReactWebSocket, { ReadyState } from "react-use-websocket";
import { toast } from "sonner";

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  const { sendMessage, lastMessage, readyState } = useReactWebSocket(url, {
    onMessage: (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, parsedMessage]);

        switch (parsedMessage.type) {
          case MessageType.Error:
            toast.error(parsedMessage.payload);
            break;
          case MessageType.Success:
            toast.success(parsedMessage.payload);
            break;
          case MessageType.Warning:
            toast.warning(parsedMessage.payload);
            break;
          case MessageType.Progress:
            // Handle progress updates
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    },
    onOpen: () => {
      console.log("WebSocket connection opened");
      toast.success("Connected to server");
    },
    onClose: () => {
      console.log("WebSocket connection closed");
      toast.error("Disconnected from server");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket error occurred");
    },
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const sendMessageCallback = useCallback(
    (message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  return {
    messages,
    sendMessage: sendMessageCallback,
    connectionStatus,
    lastMessage,
  };
}
