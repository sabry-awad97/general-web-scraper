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
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  const reconnectAttemptsRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const {
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onReconnect,
  } = options;

  const handleIncomingMessage = useCallback((event: MessageEvent<string>) => {
    try {
      setMessageHistory((prev) => [...prev, event.data]);
      console.log("Received message:", event.data);
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

  return {
    connectionError,
    isConnected,
    lastEventId,
    messageHistory,
    reconnect: () => {
      eventSourceRef.current?.close();
      reconnect();
    },
  };
}
