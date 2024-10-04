import { useMutation } from "@tanstack/react-query";
import api from "../api";

export function useClearScrapedItems() {
  return useMutation({
    mutationKey: ["clear-scraped-items"],
    mutationFn: () => {
      return api.clearScrapedItems();
    },
  });
}
