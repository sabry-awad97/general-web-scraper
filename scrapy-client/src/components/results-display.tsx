import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrapedItems, ScrapingResult } from "@/types";
import { FileJson, FileSpreadsheet, Maximize2, Minimize2 } from "lucide-react";
import React, { useState } from "react";

interface ResultsDisplayProps {
  results: ScrapingResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [insightsZoomed, setInsightsZoomed] = useState(false);
  const [navigationZoomed, setNavigationZoomed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDownloadJSON = (data: ScrapedItems, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = (data: ScrapedItems, filename: string) => {
    if (data && data.length > 0) {
      const headers = Object.keys(data[0] as Record<string, unknown>).join(",");
      const csvData = data
        .map((item) =>
          Object.values(item as Record<string, unknown>)
            .map((value) =>
              typeof value === "string"
                ? `"${value.replace(/"/g, '""')}"`
                : value,
            )
            .join(","),
        )
        .join("\n");
      const csvString = `${headers}\n${csvData}`;
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      console.log("No data to export");
    }
  };

  const renderTable = (
    data: ScrapedItems,
    caption: string,
    zoomState: boolean,
    setZoomState: (state: boolean) => void,
    downloadPrefix: string,
  ) => {
    const filteredData = data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );

    return (
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{caption}</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              // startAdornment={
              //   <Search className="w-4 h-4 text-muted-foreground" />
              // }
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setZoomState(!zoomState)}
                    variant="outline"
                    size="sm"
                  >
                    {zoomState ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{zoomState ? "Minimize" : "Maximize"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      handleDownloadJSON(data, `${downloadPrefix}_data.json`)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <FileJson className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download JSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      handleDownloadCSV(data, `${downloadPrefix}_data.csv`)
                    }
                    variant="outline"
                    size="sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea
            className={`rounded-md border ${zoomState ? "h-[80vh]" : "h-[300px]"}`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {filteredData[0] &&
                    Object.keys(filteredData[0]).map((key) => (
                      <TableHead key={key} className="font-semibold">
                        {key}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    {Object.values(item).map((value, valueIndex) => (
                      <TableCell key={valueIndex}>
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-2xl font-semibold">Harvested Insights</h2>
        <Dialog open={insightsZoomed} onOpenChange={setInsightsZoomed}>
          <DialogContent className="h-full max-h-[90vh] w-full max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>Harvested Insights</DialogTitle>
            </DialogHeader>
            {renderTable(
              results.allData,
              "Comprehensive overview of extracted data",
              insightsZoomed,
              setInsightsZoomed,
              "insights",
            )}
          </DialogContent>
        </Dialog>
        {!insightsZoomed &&
          renderTable(
            results.allData,
            "Comprehensive overview of extracted data",
            insightsZoomed,
            setInsightsZoomed,
            "insights",
          )}
      </section>

      {results.paginationInfo && (
        <section>
          <h2 className="mb-3 text-2xl font-semibold">Navigation Landscape</h2>
          <Dialog open={navigationZoomed} onOpenChange={setNavigationZoomed}>
            <DialogContent className="h-full max-h-[90vh] w-full max-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Navigation Landscape</DialogTitle>
              </DialogHeader>
              {renderTable(
                results.paginationInfo.pageUrls.map((url) => ({ url })),
                "Discovered page URLs for comprehensive scraping",
                navigationZoomed,
                setNavigationZoomed,
                "navigation",
              )}
            </DialogContent>
          </Dialog>
          {!navigationZoomed &&
            renderTable(
              results.paginationInfo.pageUrls.map((url) => ({ url })),
              "Discovered page URLs for comprehensive scraping",
              navigationZoomed,
              setNavigationZoomed,
              "navigation",
            )}
        </section>
      )}
    </div>
  );
};

export default ResultsDisplay;
