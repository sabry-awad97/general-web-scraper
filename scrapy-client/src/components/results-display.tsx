import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
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
import { FileJson, FileSpreadsheet, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { ScrapedItems, ScrapingResult } from "../types";

interface ResultsDisplayProps {
  results: ScrapingResult;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [insightsZoomed, setInsightsZoomed] = useState(false);
  const [navigationZoomed, setNavigationZoomed] = useState(false);

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
  ) => (
    <div className="relative">
      <div className="absolute z-10 flex gap-2 right-2 top-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setZoomState(!zoomState)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
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
                className="flex items-center gap-2"
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
                className="flex items-center gap-2"
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
      <ScrollArea
        className={`rounded-md border ${zoomState ? "h-[80vh]" : "h-[300px]"}`}
      >
        <Table className="w-full whitespace-nowrap">
          <TableCaption>{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {data[0] &&
                Object.keys(data[0]).map((key) => (
                  <TableHead key={key} className="font-semibold">
                    {key}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
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
    </div>
  );

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-2xl font-semibold text-white">
          Harvested Insights
        </h2>
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
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Navigation Landscape
          </h2>
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
}
