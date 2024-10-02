import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import Sidebar from "./components/sidebar";
import { useCrawl } from "./hooks/useCrawl";
import { useEventSource } from "./hooks/useEventSource";
import { PRICING } from "./lib/constants";
import { ScrapeSchema, ScrapingResult } from "./types";

function App() {
  const events = useEventSource("/api/events");

  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [performScrape, setPerformScrape] = useState(false);
  const { mutateAsync: crawl } = useCrawl();

  useEffect(() => {
    console.log("events", events);
  }, [events]);

  const onSubmit = async (values: ScrapeSchema) => {
    setPerformScrape(true);

    const result = await crawl(values);

    console.log("result", result);

    const mockResults = {
      allData: [
        { id: 1, title: "Item 1", price: "$10.99" },
        { id: 2, title: "Item 2", price: "$15.99" },
        { id: 3, title: "Item 3", price: "$20.99" },
      ],
      inputTokens: 1000,
      outputTokens: 500,
      totalCost:
        (PRICING[values.model as keyof typeof PRICING].input * 1500) / 1000,
      outputFolder: `output/${new Date().toISOString().split("T")[0]}`,
      paginationInfo: values.enablePagination
        ? {
            pageUrls: [
              "http://example.com/page/1",
              "http://example.com/page/2",
            ],
            tokenCounts: { inputTokens: 200, outputTokens: 100 },
            price:
              (PRICING[values.model as keyof typeof PRICING].output * 300) /
              1000,
          }
        : null,
    };

    setResults(mockResults);
  };

  const clearResults = () => {
    setResults(null);
    setPerformScrape(false);
  };

  useEffect(() => {
    document.body.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        clearResults={clearResults}
        results={results}
        onSubmit={onSubmit}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
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
            <div className="flex gap-2 mt-2">
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
                <div className="flex gap-2 mt-2">
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
