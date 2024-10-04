import { z } from "zod";

// Common schemas
const MetadataSchema = z.record(z.unknown()).nullable();

const JsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.any()),
  z.record(z.any()),
]);

// Reusable schemas
export const JsonPayloadSchema = z.array(z.record(JsonValueSchema));

export const MessageTypeSchema = z.enum([
  "error",
  "success",
  "warning",
  "progress",
  "scrapingResult",
  "raw",
]);

export const IncomingMessageSchema = z.object({
  type: MessageTypeSchema,
  payload: z.string(),
  metadata: MetadataSchema,
});

// Specific message schemas
export const ErrorMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("error"),
  timestamp: z.number(),
});

export const SuccessMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("success"),
  payload: JsonPayloadSchema,
  timestamp: z.number(),
});

export const WarningMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("warning"),
  timestamp: z.number(),
});

export const ProgressMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("progress"),
  timestamp: z.number(),
});

export const RawMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("raw"),
  timestamp: z.number(),
});

export const ScrapingResultMessageSchema = IncomingMessageSchema.extend({
  type: z.literal("scrapingResult"),
  timestamp: z.number(),
});

// Main schemas
export const scrapeSchema = z.object({
  model: z.string().min(1, "Please select a model"),
  apiKey: z.string().min(1, "Please enter your API key"),
  url: z.string().min(1, "Please enter a URL"),
  enableScraping: z.boolean(),
  tags: z.array(z.string()).default([]),
  enablePagination: z.boolean(),
  paginationDetails: z.string().optional(),
});

export const ConnectionStatusSchema = z.enum([
  "Connecting",
  "Open",
  "Closing",
  "Closed",
  "Uninstantiated",
]);

export const WebSocketMessageSchema = z.discriminatedUnion("type", [
  ErrorMessageSchema,
  SuccessMessageSchema,
  WarningMessageSchema,
  ProgressMessageSchema,
  RawMessageSchema,
  ScrapingResultMessageSchema,
]);

export const MessageHistorySchema = z.record(
  MessageTypeSchema,
  z.array(WebSocketMessageSchema),
);
