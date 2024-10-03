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
import { Eye, EyeOff, Info, Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  clearResults: () => void;
  results: ScrapingResult | null;
  onSubmit: (data: ScrapeSchema) => void;
  isPending: boolean;
}

const Sidebar = ({ clearResults, results, onSubmit, isPending }: Props) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<ScrapeSchema>({
    resolver: zodResolver(scrapeSchema),
    defaultValues: {
      model: "",
      apiKey: "",
      url: "",
      enableScraping: false,
      tags: [],
      enablePagination: false,
      paginationDetails: undefined,
    },
  });

  return (
    <div className="w-80 overflow-y-auto bg-secondary p-6">
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
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  API Key
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-2 h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter your Gemini API key here.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your API key"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Your API key is securely stored and never shared.
                </FormDescription>
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Scraping</FormLabel>
                  <FormDescription>Specify fields to extract</FormDescription>
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value?.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex cursor-pointer items-center"
                      >
                        {tag}
                        <X
                          className="ml-1 h-3 w-3"
                          onClick={() => {
                            field.onChange(
                              field.value?.filter((t) => t !== tag),
                            );
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Enable Pagination</FormLabel>
                  <FormDescription>Specify pagination details</FormDescription>
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
                    <Input
                      placeholder="E.g., Next button selector"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              "Start Scraping"
            )}
          </Button>
        </form>
      </Form>

      <Button
        className="mt-4 w-full"
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
              <span className="font-semibold">
                ${results.totalCost.toFixed(4)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Sidebar;
