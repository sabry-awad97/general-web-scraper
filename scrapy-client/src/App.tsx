import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AlertManager from "./components/alert-manager";
import ConnectionStatus from "./components/connection-status";
import MessagePreview from "./components/message-preview";
import ResultsDisplay from "./components/results-display";
import Sidebar from "./components/sidebar";
import WelcomeCard from "./components/welcome-card";
import { useCrawl } from "./hooks/useCrawl";
import { useWebSocketContext } from "./hooks/useWebSocketContext";
import { generateMockResults } from "./lib/constants";
import { ScrapeSchema, ScrapingResult } from "./types";
import { ThemeToggle } from "./components/theme-toggle";

function App() {
  const { isConnected, connectionError, getMessagesByType } =
    useWebSocketContext();

  const successMessages = getMessagesByType("success");

  const payload = successMessages[0]?.payload || [];

  useEffect(() => {
    console.log({ successMessages });
  }, [successMessages]);

  const [results, setResults] = useState<ScrapingResult | null>(null);
  const {
    mutateAsync: crawl,
    isPending,
    isSuccess,
    isError,
    error: crawlError,
  } = useCrawl();

  const onSubmit = async (values: ScrapeSchema) => {
    try {
      await crawl(values);
      celebrateSuccess();
      const mockResults = generateMockResults(values);
      setResults(mockResults);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar results={results} onSubmit={onSubmit} isPending={isPending} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Universal Web Scraper 🦑</h1>
          <ThemeToggle />
        </div>

        <ConnectionStatus
          isConnected={isConnected}
          connectionError={connectionError}
        />

        <AlertManager
          isPending={isPending}
          isError={isError}
          crawlError={crawlError}
        />

        {isSuccess && results ? (
          <ResultsDisplay results={results} receivedJsonData={payload} />
        ) : (
          <WelcomeCard />
        )}

        <div className="mt-6">
          <MessagePreview />
        </div>
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
