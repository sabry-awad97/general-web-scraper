import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ScrapingRule } from "./api";
import { useCrawl } from "./hooks/useCrawl";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DownloadIcon, Loader2, PlusIcon, TrashIcon, X } from "lucide-react";
import { KeyboardEvent } from "react";

function App() {
  const [urls, setUrls] = useState("");
  const [delay, setDelay] = useState(100);
  const [crawlingConcurrency, setCrawlingConcurrency] = useState(2);
  const [processingConcurrency, setProcessingConcurrency] = useState(2);
  const [results, setResults] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [newField, setNewField] = useState("");
  const { mutateAsync: crawl, isPending } = useCrawl();
  const [scrapingRules, setScrapingRules] = useState<ScrapingRule[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "results" | "rules">(
    "config",
  );
  const [resultFormat, setResultFormat] = useState<"json" | "csv">("json");
  const [followLinks, setFollowLinks] = useState(false);
  const [maxDepth, setMaxDepth] = useState(1);
  const [wsMessages, setWsMessages] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      setWsMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWsMessages([]); // Clear previous messages
    try {
      const response = await crawl({
        urls: urls.split("\n"),
        delay,
        crawling_concurrency: crawlingConcurrency,
        processing_concurrency: processingConcurrency,
        scraping_rules: scrapingRules,
        follow_links: followLinks,
        max_depth: maxDepth,
      });
      setResults(response.items);
      toast.success("Crawling completed", {
        description: "The crawling process has finished successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Crawling failed", {
        description: "An error occurred while crawling. Please try again.",
      });
    }
  };

  const handleAddField = () => {
    if (newField && !fields.includes(newField)) {
      setFields([...fields, newField]);
      setNewField("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddField();
    }
  };

  const handleRemoveField = (field: string) => {
    setFields(fields.filter((f) => f !== field));
  };

  const handleAddRule = () => {
    setScrapingRules([
      ...scrapingRules,
      {
        selector: "",
        attribute: "text",
        name: "",
        type: "text",
      },
    ]);
  };

  const handleUpdateRule = (
    index: number,
    field: keyof ScrapingRule,
    value: string | ScrapingRule["type"],
  ) => {
    const updatedRules = [...scrapingRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };

    // Reset customFunction when type is not 'custom'
    if (field === "type" && value !== "custom") {
      delete updatedRules[index].customFunction;
    }

    setScrapingRules(updatedRules);
  };

  const handleRemoveRule = (index: number) => {
    setScrapingRules(scrapingRules.filter((_, i) => i !== index));
  };

  const handleDownloadResults = () => {
    let content: string;
    let filename: string;

    if (resultFormat === "json") {
      content = JSON.stringify(results, null, 2);
      filename = "scraping_results.json";
    } else {
      // Convert results to CSV
      const headers = Object.keys(results[0] || {}).join(",");
      const rows = results
        .map((item) => Object.values(item).join(","))
        .join("\n");
      content = `${headers}\n${rows}`;
      filename = "scraping_results.csv";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-6 text-3xl font-bold">Advanced Web Scraper</h1>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="rules">Scraping Rules</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Fields to Scrape:
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {fields.map((field) => (
                      <div
                        key={field}
                        className="flex items-center px-3 py-1 text-sm rounded-full bg-secondary"
                      >
                        {field}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-2 text-secondary-foreground"
                          onClick={() => handleRemoveField(field)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add a field to scrape"
                      value={newField}
                      onChange={(e) => setNewField(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button type="button" onClick={handleAddField}>
                      Add
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="follow-links"
                    checked={followLinks}
                    onCheckedChange={setFollowLinks}
                  />
                  <label htmlFor="follow-links" className="text-sm font-medium">
                    Follow links
                  </label>
                </div>
                {followLinks && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Depth:</label>
                    <Input
                      type="number"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Crawling...</span>
                    </>
                  ) : (
                    "Start Crawling"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Scraping Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scrapingRules.map((rule, index) => (
                  <div key={index} className="p-4 space-y-2 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="CSS Selector"
                        value={rule.selector}
                        onChange={(e) =>
                          handleUpdateRule(index, "selector", e.target.value)
                        }
                      />
                      <Select
                        value={rule.type}
                        onValueChange={(value) =>
                          handleUpdateRule(
                            index,
                            "type",
                            value as ScrapingRule["type"],
                          )
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="attribute">Attribute</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="custom">
                            Custom Function
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {rule.type === "attribute" && (
                        <Input
                          placeholder="Attribute name"
                          value={rule.attribute}
                          onChange={(e) =>
                            handleUpdateRule(index, "attribute", e.target.value)
                          }
                        />
                      )}
                      <Input
                        placeholder="Field name"
                        value={rule.name}
                        onChange={(e) =>
                          handleUpdateRule(index, "name", e.target.value)
                        }
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveRule(index)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    {rule.type === "custom" && (
                      <div className="mt-2">
                        <label className="text-sm font-medium">
                          Custom Function:
                        </label>
                        <Textarea
                          value={rule.customFunction || ""}
                          onChange={(e) =>
                            handleUpdateRule(
                              index,
                              "customFunction",
                              e.target.value,
                            )
                          }
                          placeholder="(element) => { /* Your custom scraping logic here */ }"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button onClick={handleAddRule}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Select
                  value={resultFormat}
                  onValueChange={(value) =>
                    setResultFormat(value as "json" | "csv")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleDownloadResults}>
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
              </div>
              <ul className="max-h-[400px] space-y-2 overflow-y-auto">
                {results.map((item, index) => (
                  <li key={index} className="p-2 rounded-md bg-secondary">
                    <pre>{JSON.stringify(item, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Crawling Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {wsMessages.map((message, index) => (
              <li key={index} className="text-sm">
                {message}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;