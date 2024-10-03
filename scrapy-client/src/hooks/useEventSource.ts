import JSON5 from "json5";
import { useCallback, useEffect, useState } from "react";

type JsonPayload = Record<string, string | number | boolean | null>[];

export function useEventSource(url: string) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedJsonData, setReceivedJsonData] = useState<JsonPayload[]>([]);

  const handleIncomingMessage = useCallback((event: MessageEvent<string>) => {
    try {
      const parsedMessage = JSON5.parse(event.data);
      switch (parsedMessage.type) {
        case "text": {
          console.log("Received message:", parsedMessage.payload);
          break;
        }
        case "json": {
          const jsonPayload = JSON5.parse<JsonPayload[]>(parsedMessage.payload);
          setReceivedJsonData(jsonPayload);
          break;
        }
        default: {
          console.warn(
            "Received message with unknown type:",
            parsedMessage.type,
          );
        }
      }
    } catch (error) {
      console.error("Error parsing or validating message:", error);
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource;

    const initializeConnection = () => {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.onmessage = handleIncomingMessage;

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error);
        setConnectionError("Connection error");
        setIsConnected(false);
        eventSource.close();
        setTimeout(initializeConnection, 5000);
      };
    };

    initializeConnection();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [url, handleIncomingMessage]);

  return {
    connectionError,
    isConnected,
    receivedJsonData,
  };
}
