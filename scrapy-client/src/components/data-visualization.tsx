import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ScrapedItems } from "../types";

interface DataVisualizationProps {
  data: ScrapedItems;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const chartData = Object.entries(data[0] || {}).map(([key, value]) => ({
    name: key,
    value: typeof value === "number" ? value : String(value).length,
  }));

  return (
    <div className="h-[600px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
