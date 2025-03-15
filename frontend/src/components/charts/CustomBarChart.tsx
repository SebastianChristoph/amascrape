
import { BarChart } from "@mui/x-charts/BarChart";

interface CustomBarChartProps {
  data: any[];
}

export default function CustomBarChart({ data }: CustomBarChartProps) {
  if (!data || data.length === 0) {
    return <p>Keine Daten verfügbar</p>;
  }

  return (
    <BarChart
      dataset={data}
      series={[
        { dataKey: "series1", label: "Serie 1" },
        { dataKey: "series2", label: "Serie 2" },
        { dataKey: "series3", label: "Serie 3" },
        { dataKey: "series4", label: "Serie 4" },
      ]}
      height={300}
      xAxis={[{ scaleType: "band", dataKey: "quarter" }]}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
    />
  );
}
