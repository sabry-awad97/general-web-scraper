import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JsonPayload, ScrapingResult } from "../types";

interface ResultsDisplayProps {
  results: ScrapingResult;
  receivedJsonData: JsonPayload;
}

export default function ResultsDisplay({
  results,
  receivedJsonData,
}: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-2xl font-semibold text-white">
          Scraped/Parsed Data
        </h2>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table className="w-full whitespace-nowrap">
            <TableHeader>
              <TableRow>
                {receivedJsonData[0] &&
                  Object.keys(receivedJsonData[0]).map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivedJsonData.map((item, index) => (
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

      <section>
        <h2 className="mb-2 text-2xl font-semibold text-white">
          Download Options
        </h2>
        <div className="flex gap-2">
          <Button onClick={() => alert("Downloading JSON...")}>
            Download JSON
          </Button>
          <Button onClick={() => alert("Downloading CSV...")}>
            Download CSV
          </Button>
        </div>
      </section>

      {results.paginationInfo && (
        <section>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Pagination Information
          </h2>
          <ScrollArea className="h-[200px] rounded-md border">
            <Table className="w-full whitespace-nowrap">
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => alert("Downloading Pagination JSON...")}>
              Download Pagination JSON
            </Button>
            <Button onClick={() => alert("Downloading Pagination CSV...")}>
              Download Pagination CSV
            </Button>
          </div>
        </section>
      )}

      <Card className="bg-white/10 text-white">
        <CardHeader>
          <CardTitle>Output Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Output Folder: {results.outputFolder}</p>
        </CardContent>
      </Card>
    </div>
  );
}
