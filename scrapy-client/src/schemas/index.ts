import { z } from "zod";

export const scrapeSchema = z.object({
  model: z.string().min(1, "Please select a model"),
  urls: z.string().min(1, "Please enter at least one URL"),
  enableScraping: z.boolean(),
  fieldsToExtract: z.array(z.string()).optional(),
  enablePagination: z.boolean(),
  paginationDetails: z.string().optional(),
});

