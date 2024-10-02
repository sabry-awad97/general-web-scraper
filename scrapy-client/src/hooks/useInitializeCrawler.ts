import { useMutation } from "@tanstack/react-query";
import api, { InitializeParams } from "../api";

export function useInitializeCrawler() {
  return useMutation({
    mutationKey: ["initializeCrawler"],
    mutationFn: (params: InitializeParams) => api.initialize(params),
  });
}
