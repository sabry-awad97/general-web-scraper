import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const createEventMessageSchema = () =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("text"),
      payload: z.string(),
    }),
    z.object({
      type: z.literal("json"),
      payload: z.array(
        z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
      ),
    }),
  ]);

const EventMessageSchema = createEventMessageSchema();

type EventMessage = z.infer<typeof EventMessageSchema>;

type JsonPayload = Extract<EventMessage, { type: "json" }>["payload"][number];

export function useEventSource(url: string) {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedJsonData, setReceivedJsonData] = useState<JsonPayload[]>([]);

  const handleIncomingMessage = useCallback((event: MessageEvent<string>) => {
    try {
      const parsedMessage = JSON.parse(event.data) as {
        type: "text" | "json";
        payload: string;
      };
      console.log("Received message:", parsedMessage);
    } catch (error) {
      console.error("Error parsing or validating message:", error);
      setConnectionError("Failed to parse or validate message");
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
