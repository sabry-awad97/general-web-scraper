import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
} from "lucide-react";
import React, { useState } from "react";

interface ResultsDisplayProps {
  results: ScrapingResult[];
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
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderTable = (
    data: ScrapedItems,
    description: string,
    isZoomed: boolean,
    setZoomed: React.Dispatch<React.SetStateAction<boolean>>,
    type: "insights" | "navigation",
  ) => {
    if (!data || data.length === 0) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription>
            There is no data to display for this section.
          </AlertDescription>
        </Alert>
      );
    }

    const filteredData = data.filter((item) =>
      Object.values(item).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );

    const headers = Object.keys(data[0] as Record<string, unknown>);

    return (
      <Card className="h-full w-full bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{description}</CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleDownloadJSON(
                        data,
                        `${type}_data_${new Date().toISOString()}.json`,
                      )
                    }
                  >
                    <FileJson className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as JSON</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      handleDownloadCSV(
                        data,
                        `${type}_data_${new Date().toISOString()}.csv`,
                      )
                    }
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download as CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoomed(!isZoomed)}
                  >
                    {isZoomed ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isZoomed ? "Minimize" : "Maximize"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <ScrollArea className="h-[calc(100vh-300px)] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={index}>
                      {headers.map((header) => (
                        <TableCell key={header}>
                          {(item as Record<string, unknown>)[header] as string}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {results.map((result, index) => (
        <React.Fragment key={index}>
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              Harvested Insights - Job {index + 1}
            </h2>
            <Dialog open={insightsZoomed} onOpenChange={setInsightsZoomed}>
              <DialogContent className="h-full max-h-[90vh] w-full max-w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Harvested Insights</DialogTitle>
                </DialogHeader>
                {renderTable(
                  result.allData,
                  "Comprehensive overview of extracted data",
                  insightsZoomed,
                  setInsightsZoomed,
                  "insights",
                )}
              </DialogContent>
            </Dialog>
            {!insightsZoomed &&
              renderTable(
                result.allData,
                "Comprehensive overview of extracted data",
                insightsZoomed,
                setInsightsZoomed,
                "insights",
              )}
          </section>
          {result.paginationInfo && (
            <section>
              <h2 className="mb-3 text-2xl font-semibold">
                Navigation Landscape - Job {index + 1}
              </h2>
              <Dialog
                open={navigationZoomed}
                onOpenChange={setNavigationZoomed}
              >
                <DialogContent className="h-full max-h-[90vh] w-full max-w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Navigation Landscape</DialogTitle>
                  </DialogHeader>
                  {renderTable(
                    result.paginationInfo.pageUrls.map((url) => ({ url })),
                    "Discovered page URLs for comprehensive scraping",
                    navigationZoomed,
                    setNavigationZoomed,
                    "navigation",
                  )}
                </DialogContent>
              </Dialog>
              {!navigationZoomed &&
                renderTable(
                  result.paginationInfo.pageUrls.map((url) => ({ url })),
                  "Discovered page URLs for comprehensive scraping",
                  navigationZoomed,
                  setNavigationZoomed,
                  "navigation",
                )}
            </section>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
export default ResultsDisplay;
