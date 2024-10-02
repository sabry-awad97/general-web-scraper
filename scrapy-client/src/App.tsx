import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useEffect, useState } from "react";

// Mock PRICING object (replace with actual data)
const PRICING = {
  "GPT-3.5-Turbo": { price: 0.002 },
  "GPT-4": { price: 0.03 },
};

interface ScrapeResults {
  allData: {
    id: number;
    title: string;
    price: string;
  }[];
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  outputFolder: string;
  paginationInfo: {
    pageUrls: string[];
    tokenCounts: {
      inputTokens: number;
      outputTokens: number;
    };
    price: number;
  } | null;
}

function App() {
  const [results, setResults] = useState<ScrapeResults | null>(null);
  const [performScrape, setPerformScrape] = useState(false);
  const [modelSelection, setModelSelection] = useState(Object.keys(PRICING)[0]);
  const [urlInput, setUrlInput] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [usePagination, setUsePagination] = useState(false);
  const [paginationDetails, setPaginationDetails] = useState("");

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      console.log("event", event);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleScrape = async () => {
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
        (PRICING[modelSelection as keyof typeof PRICING].price * 1500) / 1000,
      outputFolder: `output/${new Date().toISOString().split("T")[0]}`,
      paginationInfo: usePagination
        ? {
            pageUrls: [
              "http://example.com/page/1",
              "http://example.com/page/2",
            ],
            tokenCounts: { inputTokens: 200, outputTokens: 100 },
            price:
              (PRICING[modelSelection as keyof typeof PRICING].price * 300) /
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

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (event.target as HTMLInputElement).value) {
      setTags([...tags, (event.target as HTMLInputElement).value]);
      (event.target as HTMLInputElement).value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  useEffect(() => {
    document.body.classList.add("dark");
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-secondary p-4">
        <h2 className="mb-4 text-2xl font-bold">Web Scraper Settings</h2>

        <Select value={modelSelection} onValueChange={setModelSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(PRICING).map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="mt-4"
          placeholder="Enter URL(s) separated by whitespace"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />

        <div className="mt-4 flex items-center">
          <Switch
            id="show-tags"
            checked={showTags}
            onCheckedChange={setShowTags}
          />
          <Label htmlFor="show-tags" className="ml-2">
            Enable Scraping
          </Label>
        </div>

        {showTags && (
          <div className="mt-4">
            <Label htmlFor="tags-input">Enter Fields to Extract:</Label>
            <Input
              id="tags-input"
              placeholder="Press enter to add a tag"
              onKeyPress={handleAddTag}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center">
          <Switch
            id="use-pagination"
            checked={usePagination}
            onCheckedChange={setUsePagination}
          />
          <Label htmlFor="use-pagination" className="ml-2">
            Enable Pagination
          </Label>
        </div>

        {usePagination && (
          <Input
            className="mt-4"
            placeholder="Enter Pagination Details"
            value={paginationDetails}
            onChange={(e) => setPaginationDetails(e.target.value)}
          />
        )}

        <Button className="mt-4 w-full" onClick={handleScrape}>
          Scrape
        </Button>
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
