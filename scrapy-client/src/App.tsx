import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import confetti from "canvas-confetti";
import { AlertCircle, CheckCircle, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Sidebar from "./components/sidebar";
import { useCrawl } from "./hooks/useCrawl";
import { useEventSource } from "./hooks/useEventSource";
import { PRICING } from "./lib/constants";
import { ScrapeSchema, ScrapingResult } from "./types";

function App() {
  const {
    jsonMessages,
    error: eventSourceErrorMessage,
    isConnected,
  } = useEventSource("/api/events");

  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [performScrape, setPerformScrape] = useState(false);
  const {
    mutateAsync: crawl,
    isPending,
    isError,
    error: crawlError,
  } = useCrawl();

  const onSubmit = async (values: ScrapeSchema) => {
    setPerformScrape(true);

    try {
      await crawl(values);

      // Success celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("Scraping Completed", {
        description: "Your data has been successfully scraped and processed.",
      });

      const mockResults = {
        allData: [],
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
    } catch (error) {
      toast.error("Scraping Failed", {
        description: `An error occurred while scraping: ${error}`,
      });
    }
  };

  const clearResults = () => {
    setResults(null);
    setPerformScrape(false);
  };

  useEffect(() => {
    document.body.classList.add("dark");
  }, []);

  if (!isConnected) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Connecting to server...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        clearResults={clearResults}
        results={results}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <h1 className="mb-4 text-3xl font-bold">Universal Web Scraper 🦑</h1>

        {eventSourceErrorMessage && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to the event source. Please check your internet
              connection and try again.
              {eventSourceErrorMessage && (
                <span className="mt-2 block text-sm opacity-75">
                  Error details: {eventSourceErrorMessage}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Scraping in progress</AlertTitle>
            <AlertDescription>
              Please wait while we fetch your data. This may take a few moments.
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scraping Failed</AlertTitle>
            <AlertDescription>
              {crawlError?.message ||
                "An unexpected error occurred. Please try again or contact support if the issue persists."}
            </AlertDescription>
          </Alert>
        )}

        {performScrape && results && (
          <Alert variant="default" className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Scraping Completed</AlertTitle>
            <AlertDescription>
              Your data has been successfully scraped and processed.
            </AlertDescription>
          </Alert>
        )}

        {performScrape && results ? (
          <>
            <h2 className="mt-4 text-2xl font-semibold">Scraped/Parsed Data</h2>
            <ScrollArea className="mt-2 h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {jsonMessages[0] &&
                      Object.keys(jsonMessages[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jsonMessages.map((item, index) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Universal Web Scraper</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                To get started, configure your scraping parameters in the
                sidebar and click "Scrape".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
