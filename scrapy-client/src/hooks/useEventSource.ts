import { JsonPayloadSchema, MessageSchema } from "@/schemas";
import { JsonPayload, MessageType } from "@/types";
import JSON5 from "json5";
import { useCallback, useEffect, useRef, useState } from "react";

interface EventSourceOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onReconnect?: () => void;
}

export function useEventSource(url: string, options: EventSourceOptions = {}) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedJsonData, setReceivedJsonData] = useState<JsonPayload>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<
    Array<{ type: MessageType; payload: string }>
  >([]);

  const reconnectAttemptsRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onReconnect,
  } = options;

  const handleIncomingMessage = useCallback((event: MessageEvent<string>) => {
    try {
      const parsedMessage = MessageSchema.parse(JSON5.parse(event.data));

      console.log("Received message:", parsedMessage.type);

      switch (parsedMessage.type) {
        case MessageType.Success: {
          const jsonPayload = JsonPayloadSchema.parse(
            JSON5.parse(parsedMessage.payload),
          );
          setReceivedJsonData(jsonPayload);
          break;
        }
        case MessageType.Progress: {
          console.log("Received progress:", parsedMessage.payload);
          break;
        }
        case MessageType.Error: {
          console.error("Received error:", parsedMessage.payload);
          break;
        }
        case MessageType.Warning: {
          console.warn("Received warning:", parsedMessage.payload);
          break;
        }
        case MessageType.Raw: {
          console.log("Received raw:", parsedMessage.payload);
          break;
        }
      }
    } catch (error) {
      console.error("Error parsing or validating message:", error);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setConnectionError("Max reconnection attempts reached");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setTimeout(() => {
      initializeConnection();
      if (onReconnect) onReconnect();
    }, reconnectInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxReconnectAttempts, reconnectInterval, onReconnect]);

  const initializeConnection = useCallback(() => {
    eventSourceRef.current = new EventSource(url, { withCredentials: true });

    eventSourceRef.current.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    };

    eventSourceRef.current.onmessage = (event: MessageEvent<string>) => {
      handleIncomingMessage(event);
      setLastEventId(event.lastEventId);
      setMessageHistory((prev) => [...prev, JSON5.parse(event.data)]);
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("EventSource failed:", error);
      setConnectionError("Connection error");
      setIsConnected(false);
      eventSourceRef.current?.close();
      reconnect();
    };
  }, [url, handleIncomingMessage, reconnect]);

  useEffect(() => {
    initializeConnection();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [initializeConnection]);

  const sendMessage = useCallback((message: string) => {
    if (
      eventSourceRef.current &&
      eventSourceRef.current.readyState === EventSource.OPEN
    ) {
      // In a real implementation, you'd need server support for this
      console.log("Sending message:", message);
    } else {
      console.error("Connection not open. Unable to send message.");
    }
  }, []);

  return {
    connectionError,
    isConnected,
    receivedJsonData,
    lastEventId,
    messageHistory,
    sendMessage,
    reconnect: () => {
      eventSourceRef.current?.close();
      reconnect();
    },
  };
}
