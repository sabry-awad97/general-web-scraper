import { z } from "zod";

export const scrapeSchema = z.object({
  model: z.string().min(1, "Please select a model"),
  apiKey: z.string().min(1, "Please enter your API key"),
  url: z.string().min(1, "Please enter a URL"),
  enableScraping: z.boolean(),
  tags: z.array(z.string()).default([]),
  enablePagination: z.boolean(),
  paginationDetails: z.string().optional(),
});

export const JsonPayloadSchema = z.array(
  z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.any()),
      z.record(z.any()),
    ]),
  ),
);
