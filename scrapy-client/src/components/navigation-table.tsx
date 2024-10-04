import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NavigationTableProps {
  data?: string[];
}

export function NavigationTable({ data }: NavigationTableProps) {
  if (!data || data.length === 0) {
    return <p>No navigation data available.</p>;
  }

  return (
    <ScrollArea className="h-[600px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Page URL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((url, index) => (
            <TableRow key={index}>
              <TableCell>{url}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
