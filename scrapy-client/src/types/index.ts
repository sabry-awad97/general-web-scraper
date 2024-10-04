import {
  ConnectionStatusSchema,
  ErrorMessageSchema,
  JsonPayloadSchema,
  MessageHistorySchema,
  MessageTypeSchema,
  ProgressMessageSchema,
  scrapeSchema,
  SuccessMessageSchema,
  WarningMessageSchema,
  WebSocketMessageSchema,
} from "@/schemas";
import { z } from "zod";

export type ScrapeSchema = z.infer<typeof scrapeSchema>;

export interface ScrapingResult {
  allData: Record<string, string | number | boolean | null>[];
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  paginationInfo: {
    pageUrls: string[];
    tokenCounts: {
      inputTokens: number;
      outputTokens: number;
    };
    price: number;
  } | null;
}

export type JsonPayload = z.infer<typeof JsonPayloadSchema>;

export type MessageType = z.infer<typeof MessageTypeSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type MessageHistory = z.infer<typeof MessageHistorySchema>;
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;
export type WarningMessage = z.infer<typeof WarningMessageSchema>;
export type ProgressMessage = z.infer<typeof ProgressMessageSchema>;
