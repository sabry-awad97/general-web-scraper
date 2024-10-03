import { scrapeSchema } from "@/schemas";
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
