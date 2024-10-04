import api from "@/api";
import { useQuery } from "@tanstack/react-query";

export const useModels = () => {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => api.getModels(),
  });
};
