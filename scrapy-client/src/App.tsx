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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScrapingResult } from "./types";

// Mock PRICING object (replace with actual data)
const PRICING = {
  "GPT-3.5-Turbo": { price: 0.002 },
  "GPT-4": { price: 0.03 },
};

const formSchema = z.object({
  model: z.string().min(1, "Please select a model"),
  urls: z.string().min(1, "Please enter at least one URL"),
  enableScraping: z.boolean(),
  fieldsToExtract: z.array(z.string()).optional(),
  enablePagination: z.boolean(),
  paginationDetails: z.string().optional(),
});

function App() {
  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [performScrape, setPerformScrape] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: Object.keys(PRICING)[0],
      urls: "",
      enableScraping: false,
      fieldsToExtract: [],
      enablePagination: false,
      paginationDetails: "",
    },
  });

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      console.log("event", event);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setPerformScrape(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResults = {
      allData: [
        { id: 1, title: "Item 1", price: "$10.99" },
        { id: 2, title: "Item 2", price: "$15.99" },
        { id: 3, title: "Item 3", price: "$20.99" },
      ],
      inputTokens: 1000,
      outputTokens: 500,
      totalCost:
        (PRICING[values.model as keyof typeof PRICING].price * 1500) / 1000,
      outputFolder: `output/${new Date().toISOString().split("T")[0]}`,
      paginationInfo: values.enablePagination
        ? {
            pageUrls: [
              "http://example.com/page/1",
              "http://example.com/page/2",
            ],
            tokenCounts: { inputTokens: 200, outputTokens: 100 },
            price:
              (PRICING[values.model as keyof typeof PRICING].price * 300) /
              1000,
          }
        : null,
    };

    setResults(mockResults);
  };

  const clearResults = () => {
    setResults(null);
    setPerformScrape(false);
    form.reset();
  };

  useEffect(() => {
    document.body.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-secondary p-4">
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value?.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => {
                            field.onChange(
                              field.value?.filter((t) => t !== tag),
                            );
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Pagination
                    </FormLabel>
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
                      <Input
                        placeholder="Enter Pagination Details"
                        {...field}
                      />
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
          className="mt-2 w-full"
          variant="outline"
          onClick={clearResults}
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <h1 className="mb-4 text-3xl font-bold">Universal Web Scraper 🦑</h1>

        {performScrape && results ? (
          <>
            <h2 className="mt-4 text-2xl font-semibold">Scraped/Parsed Data</h2>
            <ScrollArea className="mt-2 h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(results.allData[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.allData.map((item, index) => (
                    <TableRow key={index}>
                      {Object.values(item).map((value, valueIndex) => (
                        <TableCell key={valueIndex}>{value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <h2 className="mt-4 text-2xl font-semibold">Download Options</h2>
            <div className="mt-2 flex gap-2">
              <Button onClick={() => alert("Downloading JSON...")}>
                Download JSON
              </Button>
              <Button onClick={() => alert("Downloading CSV...")}>
                Download CSV
              </Button>
            </div>

            {results.paginationInfo && (
              <>
                <h2 className="mt-4 text-2xl font-semibold">
                  Pagination Information
                </h2>
                <ScrollArea className="mt-2 h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page URLs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.paginationInfo.pageUrls.map((url, index) => (
                        <TableRow key={index}>
                          <TableCell>{url}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="mt-2 flex gap-2">
                  <Button
                    onClick={() => alert("Downloading Pagination JSON...")}
                  >
                    Download Pagination JSON
                  </Button>
                  <Button
                    onClick={() => alert("Downloading Pagination CSV...")}
                  >
                    Download Pagination CSV
                  </Button>
                </div>
              </>
            )}

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Output Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Output Folder: {results.outputFolder}</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <p>No results to display. Click "Scrape" to start.</p>
        )}
      </div>
    </div>
  );
}

export default App;
