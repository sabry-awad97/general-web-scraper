import { Button } from "@/components/ui/button";
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
import { FileJson, FileSpreadsheet } from "lucide-react";
import { ScrapingResult } from "../types";

interface ResultsDisplayProps {
  results: ScrapingResult;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(results.allData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scraped_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (results.allData && results.allData.length > 0) {
      const headers = Object.keys(
        results.allData[0] as Record<string, unknown>,
      ).join(",");
      const csvData = results.allData
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
      a.download = "scraped_data.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      console.log("No data received");
    }
  };

  const handleDownloadPaginationJSON = () => {
    const jsonString = JSON.stringify(results.paginationInfo, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pagination_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPaginationCSV = () => {
    if (results.paginationInfo && results.paginationInfo.pageUrls.length > 0) {
      const csvData = results.paginationInfo.pageUrls.join("\n");
      const csvString = `Page URLs\n${csvData}`;
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pagination_data.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      console.log("No pagination data available");
    }
  };

  return (
    <div className="space-y-8">
      <section className="relative">
        <h2 className="mb-3 text-2xl font-semibold text-white">
          Harvested Insights
        </h2>
        <div className="absolute top-0 right-0 flex gap-2">
          <Button
            onClick={handleDownloadJSON}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            JSON
          </Button>
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </Button>
        </div>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table className="w-full whitespace-nowrap">
            <TableCaption>
              Comprehensive overview of extracted data
            </TableCaption>
            <TableHeader>
              <TableRow>
                {results.allData[0] &&
                  Object.keys(results.allData[0]).map((key) => (
                    <TableHead key={key} className="font-semibold">
                      {key}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.allData.map((item, index) => (
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
      </section>

      {results.paginationInfo && (
        <section className="relative">
          <h2 className="mb-3 text-2xl font-semibold text-white">
            Navigation Landscape
          </h2>
          <div className="absolute top-0 right-0 flex gap-2">
            <Button
              onClick={handleDownloadPaginationJSON}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </Button>
            <Button
              onClick={handleDownloadPaginationCSV}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
          </div>
          <ScrollArea className="h-[200px] rounded-md border">
            <Table className="w-full whitespace-nowrap">
              <TableCaption>
                Discovered page URLs for comprehensive scraping
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Page URLs</TableHead>
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}
    </div>
  );
}
