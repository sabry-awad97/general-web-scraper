import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

const createEventMessageSchema = () =>
  z.discriminatedUnion("type", [
    z.object({
      id: z.string(),
      type: z.literal("text"),
      payload: z.string(),
    }),
    z.object({
      id: z.string(),
      type: z.literal("json"),
      payload: z.record(
        z.union([z.string(), z.number(), z.boolean(), z.null()]),
      ),
    }),
  ]);

const EventMessageSchema = createEventMessageSchema();

type EventMessage = z.infer<typeof EventMessageSchema>;

type TextMessage = Extract<EventMessage, { type: "text" }>;
type JsonMessage = Extract<EventMessage, { type: "json" }>;

export function useEventSource(url: string) {
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [textMap, setTextMap] = useState<Map<string, TextMessage["payload"]>>(
    new Map(),
  );
  const [jsonMap, setJsonMap] = useState<Map<string, JsonMessage["payload"]>>(
    new Map(),
  );

  const jsonMessages = useMemo(() => Array.from(jsonMap.values()), [jsonMap]);

  const handleMessage = useCallback((event: MessageEvent<string>) => {
    try {
      const { type, payload: rawPayload, id } = JSON.parse(event.data);

      let parsedMessage: EventMessage;
      if (type === "json") {
        const jsonPayload = JSON.parse(rawPayload);
        parsedMessage = { type, payload: jsonPayload, id };
        setJsonMap((prev) => new Map(prev).set(id, jsonPayload));
      } else {
        parsedMessage = { type, payload: rawPayload, id };
        setTextMap((prev) => new Map(prev).set(id, rawPayload));
      }

      const validatedMessage = EventMessageSchema.parse(parsedMessage);
      console.log("Received message:", validatedMessage);
    } catch (err) {
      console.error("Error parsing or validating message:", err);
      setError("Failed to parse or validate message");
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource;

    const connect = () => {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = handleMessage;

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        setError("Connection error");
        setIsConnected(false);
        eventSource.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [url, handleMessage]);

  const clearMessages = useCallback(() => {
    setTextMap(new Map());
    setJsonMap(new Map());
  }, []);

  return {
    error,
    isConnected,
    textMap,
    jsonMessages,
    clearMessages,
  };
}
