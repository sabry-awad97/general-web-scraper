import { useMutation } from "@tanstack/react-query";
import api from "../api";

export function useClearScrapingResult() {
  return useMutation({
    mutationKey: ["clear-scraping-result"],
    mutationFn: () => {
      return api.clearScrapingResult();
    },
  });
}
