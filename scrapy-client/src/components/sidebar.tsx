import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PRICING } from "@/lib/constants";
import { scrapeSchema } from "@/schemas";
import { ScrapeSchema, ScrapingResult } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface Props {
  clearResults: () => void;
  results: ScrapingResult | null;
  onSubmit: (data: ScrapeSchema) => void;
}

const Sidebar = ({ clearResults, results, onSubmit }: Props) => {
  const form = useForm<ScrapeSchema>({
    resolver: zodResolver(scrapeSchema),
    defaultValues: {
      model: "",
      urls: "",
      enableScraping: false,
      fieldsToExtract: [],
      enablePagination: false,
      paginationDetails: "",
    },
  });

  return (
    <div className="w-64 p-4 bg-secondary">
      <h2 className="mb-4 text-2xl font-bold">Web Scraper Settings</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(PRICING).map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urls"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URLs</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter URL(s) separated by whitespace"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter one or more URLs to scrape, separated by spaces.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableScraping"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Scraping</FormLabel>
                  <FormDescription>
                    Turn on to specify fields to extract
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("enableScraping") && (
            <FormField
              control={form.control}
              name="fieldsToExtract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fields to Extract</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Press enter to add a field"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value) {
                          e.preventDefault();
                          field.onChange([
                            ...(field.value || []),
                            e.currentTarget.value,
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value?.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          field.onChange(field.value?.filter((t) => t !== tag));
                        }}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="enablePagination"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Pagination</FormLabel>
                  <FormDescription>
                    Turn on to specify pagination details
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("enablePagination") && (
            <FormField
              control={form.control}
              name="paginationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagination Details</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Pagination Details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full">
            Scrape
          </Button>
        </form>
      </Form>

      <Button
        className="w-full mt-2"
        variant="outline"
        onClick={() => {
          clearResults();
          form.reset();
        }}
      >
        Clear Results
      </Button>

      {results && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Scraping Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Input Tokens: {results.inputTokens}</p>
            <p>Output Tokens: {results.outputTokens}</p>
            <p>Total Cost: ${results.totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sidebar;
