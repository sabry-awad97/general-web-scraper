import { JsonPayloadSchema, scrapeSchema } from "@/schemas";
import { z } from "zod";

export type ScrapeSchema = z.infer<typeof scrapeSchema>;

export interface ScrapingResult {
  allData: Record<string, string | number | boolean | null>[];
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  outputFolder: string;
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

export enum MessageType {
  Progress = "progress",
  Raw = "raw",
  ScrapingResult = "scrapingResult",
  Error = "error",
  Success = "success",
  Warning = "warning",
}

export interface WebSocketMessage {
  type: MessageType;
  payload: string;
  metadata?: unknown;
}
