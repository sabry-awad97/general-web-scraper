import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { ScrapedItems } from "../types";

interface InsightsTableProps {
  data: ScrapedItems;
}

export function InsightsTable({ data }: InsightsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search insights..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
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
      </ScrollArea>
    </div>
  );
}
