import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { useState } from "react";
import { Mosaic } from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import AlertManager from "./components/alert-manager";
import ErrorManager from "./components/error-manager";
import ResultsDisplay from "./components/results-display";
import Sidebar from "./components/sidebar";
import { ThemeToggle } from "./components/theme-toggle";
import WelcomeCard from "./components/welcome-card";
import { useCrawl } from "./hooks/useCrawl";
import { useModels } from "./hooks/useModels";
import { ScrapeSchema, ScrapingResult } from "./types";

type ViewId = "sidebar" | "results" | "welcome" | "alerts" | "errors";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: models = [], error: modelsError } = useModels();
  const { mutateAsync: crawl, isPending, error: crawlError } = useCrawl();

  const [scrapingResults, setScrapingResults] = useState<
    ScrapingResult[] | null
  >(null);

  const onSubmit = async (values: ScrapeSchema) => {
    try {
      const results = await crawl(values);
      setScrapingResults(results);
    } catch (error) {
      console.error("Error during crawl:", error);
    }
  };

  const ELEMENT_MAP: { [key in ViewId]: JSX.Element } = {
    sidebar: (
      <Sidebar
        models={models}
        results={scrapingResults}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    ),
    results: scrapingResults ? (
      <ResultsDisplay results={scrapingResults} />
    ) : (
      <WelcomeCard />
    ),
    welcome: <WelcomeCard />,
    alerts: <AlertManager isPending={isPending} />,
    errors: <ErrorManager crawlError={crawlError} modelsError={modelsError} />,
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-secondary/30">
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          </Button>
          <div className="flex items-center space-x-4">
            <Input className="w-64" placeholder="Search results..." />
            <ThemeToggle />
            <Button variant="ghost" className="rounded-full">
              <User className="w-6 h-6" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <Mosaic<ViewId>
            renderTile={(id) => (
              <div className="flex flex-col h-full overflow-hidden rounded-lg shadow-lg bg-card">
                <div className="flex-1 overflow-auto">{ELEMENT_MAP[id]}</div>
              </div>
            )}
            initialValue={{
              direction: "row",
              first: "sidebar",
              second: {
                direction: "column",
                first: "results",
                second: {
                  direction: "row",
                  first: "alerts",
                  second: "errors",
                },
              },
            }}
            className="mosaic-blueprint-theme bp4-dark"
          />
        </main>
      </div>
    </div>
  );
}

export default App;
