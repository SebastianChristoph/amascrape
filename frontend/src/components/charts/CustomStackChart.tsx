import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";

interface CustomStackBarsProps {
  data: any[];
}

export default function CustomStackBars({ data }: CustomStackBarsProps) {
  if (!data || data.length === 0) {
    return <p>Keine Daten verfügbar</p>;
  }

  return (
    <BarChart
      dataset={data}
      series={[
        { dataKey: "currAss", stack: "assets" },
        { dataKey: "nCurrAss", stack: "assets" },
        { dataKey: "curLia", stack: "liability" },
        { dataKey: "nCurLia", stack: "liability" },
        { dataKey: "capStock", stack: "equity" },
        { dataKey: "retEarn", stack: "equity" },
        { dataKey: "treas", stack: "equity" },
      ]}
      xAxis={[{ scaleType: "band", dataKey: "year" }]}
      slotProps={{ legend: { hidden: true } }}
      height={300}
    />
  );
}
