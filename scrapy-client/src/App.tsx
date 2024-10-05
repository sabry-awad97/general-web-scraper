import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from "canvas-confetti";
import { Menu, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AlertManager from "./components/alert-manager";
import ResultsDisplay from "./components/results-display";
import Sidebar from "./components/sidebar";
import { ThemeToggle } from "./components/theme-toggle";
import WelcomeCard from "./components/welcome-card";
import { useCrawl } from "./hooks/useCrawl";
import { useEventSource } from "./hooks/useEventSource";
import { useModels } from "./hooks/useModels";
import { ScrapeSchema, ScrapingResult } from "./types";

function App() {
  useEventSource("/api/events");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: models = [] } = useModels();
  const {
    mutateAsync: crawl,
    isPending,
    isSuccess,
    isError,
    error: crawlError,
  } = useCrawl();

  const [scrapingResults, setScrapingResults] = useState<
    ScrapingResult[] | null
  >(null);

  const onSubmit = async (values: ScrapeSchema) => {
    try {
      const results = await crawl(values);
      setScrapingResults(results);
      celebrateSuccess();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-secondary/30">
      {sidebarOpen && (
        <Sidebar
          models={models}
          results={scrapingResults}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center space-x-4">
            <Input className="w-64" placeholder="Search results..." />
            <ThemeToggle />
            <Button variant="ghost" className="rounded-full">
              <User className="w-6 h-6" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold bg-clip-text">
              Universal Web Scraper 🦑
            </h1>
          </div>

          <AlertManager
            isPending={isPending}
            isError={isError}
            crawlError={crawlError}
          />

          <Tabs defaultValue="results" className="w-full">
            <TabsList>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="results">
              {isSuccess && scrapingResults ? (
                <ResultsDisplay results={scrapingResults} />
              ) : (
                <WelcomeCard />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
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
