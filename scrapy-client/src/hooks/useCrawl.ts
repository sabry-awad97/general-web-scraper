import { useMutation } from "@tanstack/react-query";
import api, { CrawlParams } from "../api";

export function useCrawl() {
  return useMutation({
    mutationKey: ["crawl"],
    mutationFn: (params: CrawlParams) => {
      return api.crawl(params);
    },
  });
}
