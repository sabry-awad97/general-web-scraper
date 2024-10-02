import { useEffect, useState } from "react";

export function useEventSource(url: string) {
  const [events, setEvents] = useState<MessageEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      setEvents((prevEvents) => [...prevEvents, event]);
    };

    return () => {
      eventSource.close();
    };
  }, [url]);

  return events;
}
