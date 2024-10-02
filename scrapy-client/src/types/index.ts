import { scrapeSchema } from "@/schemas";
import { z } from "zod";

export type ScrapeSchema = z.infer<typeof scrapeSchema>;

export interface ScrapingResult {
  allData: {
    id: number;
    title: string;
    price: string;
  }[];
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
