import { ScrapeSchema, ScrapingResult } from "@/types";

export const PRICING = {
  "gemini-1.5-flash": {
    input: 0.075 / 1_000_000, // $0.075 per 1M input tokens
    output: 0.3 / 1_000_000, // $0.30 per 1M output tokens
  },
};

export function generateMockResults(values: ScrapeSchema): ScrapingResult {
  return {
    allData: [],
    inputTokens: 1000,
    outputTokens: 500,
    totalCost:
      (PRICING[values.model as keyof typeof PRICING].input * 1500) / 1000,
    outputFolder: `output/${new Date().toISOString().split("T")[0]}`,
    paginationInfo: values.enablePagination
      ? {
          pageUrls: ["http://example.com/page/1", "http://example.com/page/2"],
          tokenCounts: { inputTokens: 200, outputTokens: 100 },
          price:
            (PRICING[values.model as keyof typeof PRICING].output * 300) / 1000,
        }
      : null,
  };
}
