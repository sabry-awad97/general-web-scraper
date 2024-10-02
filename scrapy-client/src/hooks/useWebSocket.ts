import { useCallback, useState } from "react";
import useReactWebSocket, { ReadyState } from "react-use-websocket";

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<string[]>([]);

  const { sendMessage, lastMessage, readyState } = useReactWebSocket(url, {
    onMessage: (event) => {
      console.log("WebSocket message received:", event.data);
      setMessages((prevMessages) => [...prevMessages, event.data]);
    },
    onOpen: () => {
      console.log("WebSocket connection opened");
    },
    onClose: () => {
      console.log("WebSocket connection closed");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
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
