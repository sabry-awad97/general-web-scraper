import {
  ConnectionStatusSchema,
  ErrorMessageSchema,
  IncomingMessageSchema,
  JsonPayloadSchema,
  ProgressMessageSchema,
  RawMessageSchema,
  ScrapingResultMessageSchema,
  SuccessMessageSchema,
  WarningMessageSchema,
} from "@/schemas";
import {
  ErrorMessage,
  MessageHistory,
  MessageType,
  ProgressMessage,
  RawMessage,
  ScrapingResultMessage,
  SuccessMessage,
  WarningMessage,
  WebSocketMessage,
} from "@/types";
import { useCallback } from "react";
import useReactWebSocket, { ReadyState } from "react-use-websocket";
import { toast } from "sonner";
import { useImmerReducer } from "use-immer";

type MessageTypeMap = {
  error: ErrorMessage;
  success: SuccessMessage;
  warning: WarningMessage;
  progress: ProgressMessage;
  scrapingResult: ScrapingResultMessage;
  raw: RawMessage;
};

// Define the state and action types
type State = {
  messageHistory: MessageHistory;
  connectionError: string | null;
};

type Action =
  | {
      type: "ADD_MESSAGE";
      payload: { type: MessageType; message: WebSocketMessage };
    }
  | { type: "SET_CONNECTION_ERROR"; payload: string | null }
  | { type: "CLEAR_MESSAGES"; payload: MessageType }
  | { type: "CLEAR_HISTORY" };

// Define the reducer function
function reducer(draft: State, action: Action) {
  const { type } = action;
  switch (type) {
    case "ADD_MESSAGE": {
      const { type, message } = action.payload;
      draft.messageHistory[type]?.push(message);
      return draft;
    }
    case "SET_CONNECTION_ERROR":
      draft.connectionError = action.payload;
      return draft;
    case "CLEAR_MESSAGES":
      draft.messageHistory[action.payload] = [];
      return draft;
    case "CLEAR_HISTORY":
      draft.messageHistory = {
        error: [],
        success: [],
        warning: [],
        progress: [],
      };
      return draft;
  }
}

export function useWebSocket(url: string) {
  const [state, dispatch] = useImmerReducer<State, Action>(reducer, {
    messageHistory: {
      error: [],
      success: [],
      warning: [],
      progress: [],
    },
    connectionError: null,
  });

  console.log({ state });

  const { sendMessage, lastMessage, readyState } = useReactWebSocket(url, {
    onMessage: (event) => {
      try {
        const parsedMessage = IncomingMessageSchema.parse(
          JSON.parse(event.data),
        );

        switch (parsedMessage.type) {
          case "success": {
            dispatch({ type: "CLEAR_MESSAGES", payload: parsedMessage.type });

            const successMessage = SuccessMessageSchema.parse({
              type: parsedMessage.type,
              payload: JsonPayloadSchema.parse(
                JSON.parse(parsedMessage.payload),
              ),
              metadata: parsedMessage.metadata,
              timestamp: Date.now(),
            });

            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                type: parsedMessage.type,
                message: successMessage,
              },
            });

            break;
          }

          case "error": {
            const errorMessage = ErrorMessageSchema.parse({
              ...parsedMessage,
              timestamp: Date.now(),
            });

            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                type: parsedMessage.type,
                message: errorMessage,
              },
            });
            break;
          }

          case "warning": {
            const warningMessage = WarningMessageSchema.parse({
              ...parsedMessage,
              timestamp: Date.now(),
            });

            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                type: parsedMessage.type,
                message: warningMessage,
              },
            });
            break;
          }

          case "progress": {
            const progressMessage = ProgressMessageSchema.parse({
              ...parsedMessage,
              timestamp: Date.now(),
            });

            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                type: parsedMessage.type,
                message: progressMessage,
              },
            });
            break;
          }

          case "raw": {
            const rawMessage = RawMessageSchema.parse({
              ...parsedMessage,
              timestamp: Date.now(),
            });

            dispatch({
              type: "ADD_MESSAGE",
              payload: {
                type: rawMessage.type,
                message: rawMessage,
              },
            });
            break;
          }

          case "scrapingResult":
            {
              const scrapingResultMessage = ScrapingResultMessageSchema.parse({
                ...parsedMessage,
                timestamp: Date.now(),
              });

              dispatch({
                type: "ADD_MESSAGE",
                payload: {
                  type: parsedMessage.type,
                  message: scrapingResultMessage,
                },
              });
            }
            // Handle these message types similarly
            break;
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        // Consider adding an error message to the state
      }
    },
    onOpen: () => {
      console.log("WebSocket connection opened");
      toast.success("Connected to server");
      dispatch({ type: "SET_CONNECTION_ERROR", payload: null });
    },
    onClose: () => {
      console.log("WebSocket connection closed");
      toast.error("Disconnected from server");
      dispatch({
        type: "SET_CONNECTION_ERROR",
        payload: "Connection closed unexpectedly",
      });
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket error occurred");
    },
  });

  const connectionStatus = ConnectionStatusSchema.parse(
    {
      [ReadyState.CONNECTING]: "Connecting",
      [ReadyState.OPEN]: "Open",
      [ReadyState.CLOSING]: "Closing",
      [ReadyState.CLOSED]: "Closed",
      [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState],
  );

  const sendMessageCallback = useCallback(
    (message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      sendMessage(message);
    },
    [sendMessage],
  );

  const getMessagesByType = useCallback(
    <T extends MessageType>(type: T): Array<MessageTypeMap[T]> => {
      return state.messageHistory[type] as Array<MessageTypeMap[T]> || [];
    },
    [state.messageHistory],
  );

  const clearMessagesOfType = useCallback(
    (type: MessageType) => {
      dispatch({ type: "CLEAR_MESSAGES", payload: type });
    },
    [dispatch],
  );

  const clearHistory = useCallback(() => {
    dispatch({ type: "CLEAR_HISTORY" });
  }, [dispatch]);

  const sortedMessages = [
    ...getMessagesByType("success"),
    ...getMessagesByType("error"),
    ...getMessagesByType("warning"),
    ...getMessagesByType("progress"),
    ...getMessagesByType("raw"),
    ...getMessagesByType("scrapingResult"),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return {
    messageHistory: state.messageHistory,
    sortedMessages,
    sendMessage: sendMessageCallback,
    connectionStatus,
    lastMessage,
    isConnected: connectionStatus === "Open",
    connectionError: state.connectionError,
    getMessagesByType,
    clearMessagesOfType,
    clearHistory,
  };
}
