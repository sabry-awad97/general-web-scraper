import confetti from "canvas-confetti";
import { toast } from "sonner";
import AlertManager from "./components/alert-manager";
import ConnectionStatus from "./components/connection-status";
import MessagePreview from "./components/message-preview";
import ResultsDisplay from "./components/results-display";
import Sidebar from "./components/sidebar";
import { ThemeToggle } from "./components/theme-toggle";
import WelcomeCard from "./components/welcome-card";
import { useClearScrapingResult } from "./hooks/useClearScrapingResult";
import { useCrawl } from "./hooks/useCrawl";
import { useModels } from "./hooks/useModels";
import { useScrapingResult } from "./hooks/useScrapingResult";
import { useWebSocketContext } from "./hooks/useWebSocketContext";
import { ScrapeSchema } from "./types";

function App() {
  const { isConnected, connectionError } = useWebSocketContext();
  const { data: models = [] } = useModels();

  const {
    mutateAsync: crawl,
    isPending,
    isSuccess,
    isError,
    error: crawlError,
  } = useCrawl();

  const { mutateAsync: clearScrapingResult } = useClearScrapingResult();

  const { data: scrapingResult = null, refetch: refetchScrapingResult } =
    useScrapingResult();

  const onSubmit = async (values: ScrapeSchema) => {
    try {
      await clearScrapingResult();
      await crawl(values);
      refetchScrapingResult();
      celebrateSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        models={models}
        results={scrapingResult}
        onSubmit={onSubmit}
        isPending={isPending}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
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

        {isSuccess && scrapingResult ? (
          <ResultsDisplay results={scrapingResult} />
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
