import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCrawl } from "./hooks/useCrawl";

function App() {
  const [urls, setUrls] = useState("");
  const [delay, setDelay] = useState(100);
  const [crawlingConcurrency, setCrawlingConcurrency] = useState(2);
  const [processingConcurrency, setProcessingConcurrency] = useState(2);
  const [results, setResults] = useState<string[]>([]);
  const { mutateAsync: crawl, isPending } = useCrawl();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await crawl({
        urls: urls.split("\n"),
        delay,
        crawling_concurrency: crawlingConcurrency,
        processing_concurrency: processingConcurrency,
      });
      setResults(response.items);
      toast("Crawling completed", {
        description: `Successfully crawled ${response.items.length} items.`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast("Crawling failed", {
        description: "An error occurred while crawling. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Web Scraper</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crawl Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  URLs (one per line):
                </label>
                <Textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={5}
                  placeholder="Enter URLs to crawl..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Delay (ms): {delay}
                </label>
                <Slider
                  value={[delay]}
                  onValueChange={(value) => setDelay(value[0])}
                  min={0}
                  max={1000}
                  step={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Crawling Concurrency:
                  </label>
                  <Input
                    type="number"
                    value={crawlingConcurrency}
                    onChange={(e) =>
                      setCrawlingConcurrency(parseInt(e.target.value))
                    }
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Processing Concurrency:
                  </label>
                  <Input
                    type="number"
                    value={processingConcurrency}
                    onChange={(e) =>
                      setProcessingConcurrency(parseInt(e.target.value))
                    }
                    min={1}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Crawling...</span>
                  </>
                ) : (
                  "Start Crawling"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-h-[400px] space-y-2 overflow-y-auto">
              {results.map((item, index) => (
                <li key={index} className="rounded-md bg-secondary p-2">
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
