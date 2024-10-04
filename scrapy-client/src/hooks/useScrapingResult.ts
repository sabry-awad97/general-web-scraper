import api from "@/api";
import { useQuery } from "@tanstack/react-query";

export const useScrapingResult = () => {
  return useQuery({
    queryKey: ["scrapingResult"],
    queryFn: () => api.getScrapingResult(),
  });
};
