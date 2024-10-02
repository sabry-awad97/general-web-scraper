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
