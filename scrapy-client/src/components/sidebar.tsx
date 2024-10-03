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
import { Loader2, X } from "lucide-react";

interface Props {
  clearResults: () => void;
  results: ScrapingResult | null;
  onSubmit: (data: ScrapeSchema) => void;
  isPending: boolean;
}

const Sidebar = ({ clearResults, results, onSubmit, isPending }: Props) => {
  const form = useForm<ScrapeSchema>({
    resolver: zodResolver(scrapeSchema),
    defaultValues: {
      model: "",
      url: "",
      enableScraping: false,
      tags: [],
      enablePagination: false,
      paginationDetails: undefined,
    },
  });

  return (
    <div className="p-6 overflow-y-auto w-80 bg-secondary">
      <h2 className="mb-6 text-2xl font-bold">Scraper Settings</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormDescription>Enter the URL to scrape</FormDescription>
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
                    Specify fields to extract
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fields to Extract</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add field and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value) {
                          e.preventDefault();
                          field.onChange([
                            ...field.value,
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
                        className="flex items-center cursor-pointer"
                      >
                        {tag}
                        <X
                          className="w-3 h-3 ml-1"
                          onClick={() => {
                            field.onChange(field.value?.filter((t) => t !== tag));
                          }}
                        />
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
                    Specify pagination details
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
                    <Input placeholder="E.g., Next button selector" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              "Start Scraping"
            )}
          </Button>
        </form>
      </Form>

      <Button
        className="w-full mt-4"
        variant="outline"
        onClick={() => {
          clearResults();
          form.reset();
        }}
      >
        Clear Results
      </Button>

      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Scraping Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Input Tokens:</span>
              <span className="font-semibold">{results.inputTokens}</span>
            </div>
            <div className="flex justify-between">
              <span>Output Tokens:</span>
              <span className="font-semibold">{results.outputTokens}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Cost:</span>
              <span className="font-semibold">${results.totalCost.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sidebar;