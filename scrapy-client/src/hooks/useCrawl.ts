import { ScrapeSchema } from "@/types";
import { useMutation } from "@tanstack/react-query";
import api from "../api";

export function useCrawl() {
  return useMutation({
    mutationKey: ["crawl"],
    mutationFn: (params: ScrapeSchema) => {
      return api.crawl(params);
    },
  });
}
