import {
  ConnectionStatus,
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
import { createContext } from "react";

type MessageTypeMap = {
  error: ErrorMessage;
  success: SuccessMessage;
  warning: WarningMessage;
  progress: ProgressMessage;
  scrapingResult: ScrapingResultMessage;
  raw: RawMessage;
};

interface WebSocketContextValue {
  messageHistory: MessageHistory;
  sortedMessages: WebSocketMessage[];
  sendMessage: (
    message: string | ArrayBufferLike | Blob | ArrayBufferView,
  ) => void;
  connectionStatus: ConnectionStatus;
  lastMessage: MessageEvent<unknown> | null;
  isConnected: boolean;
  connectionError: string | null;
  getMessagesByType: <T extends MessageType>(
    type: T,
  ) => Array<MessageTypeMap[T]>;
  clearMessagesOfType: (type: MessageType) => void;
  clearHistory: () => void;
}

export const WebSocketContext = createContext<
  WebSocketContextValue | undefined
>(undefined);
