import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { ScrapedItems } from "../types";

interface DownloadOptionsProps {
  data: ScrapedItems;
  className?: string;
}

export function DownloadOptions({ data, className }: DownloadOptionsProps) {
  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scraped_data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (data && data.length > 0) {
      const headers = Object.keys(data[0] || {}).join(",");
      const csvData = data
        .map((item) =>
          Object.values(item)
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
    }
  };

  return (
    <div className={`flex space-x-4 ${className}`}>
      <Button onClick={handleDownloadJSON} variant="outline">
        <FileJson className="w-4 h-4 mr-2" />
        Download JSON
      </Button>
      <Button onClick={handleDownloadCSV} variant="outline">
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Download CSV
      </Button>
    </div>
  );
}
