import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AlertManager from "./components/alert-manager";
import ConnectionStatus from "./components/connection-status";
import ResultsDisplay from "./components/results-display";
import Sidebar from "./components/sidebar";
import WelcomeCard from "./components/welcome-card";
import { useCrawl } from "./hooks/useCrawl";
import { useEventSource } from "./hooks/useEventSource";
import { generateMockResults } from "./lib/constants";
import { ScrapeSchema, ScrapingResult } from "./types";

function App() {
  const { receivedJsonData, connectionError, isConnected } =
    useEventSource("/api/events");

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
      celebrateSuccess();
      const mockResults = generateMockResults(values);
      setResults(mockResults);
    } catch (error) {
      handleError(error);
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
      <Sidebar
        clearResults={clearResults}
        results={results}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      <main className="flex-1 overflow-auto p-6">
        <h1 className="mb-6 text-4xl font-bold text-white">
          Universal Web Scraper 🦑
        </h1>

        <ConnectionStatus
          isConnected={isConnected}
          connectionError={connectionError}
        />

        <AlertManager
          isPending={isPending}
          isError={isError}
          crawlError={crawlError}
        />

        {performScrape && results ? (
          <ResultsDisplay
            results={results}
            receivedJsonData={receivedJsonData}
          />
        ) : (
          <WelcomeCard />
        )}
      </main>
    </div>
  );
}

function celebrateSuccess() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
  toast.success("Scraping Completed", {
    description: "Your data has been successfully scraped and processed.",
  });
}

function handleError(error: unknown) {
  toast.error("Scraping Failed", {
    description: `An error occurred while scraping: ${error}`,
  });
}

export default App;
