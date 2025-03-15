import { Box, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart/LineChart";

interface CustomLineChartProps {
  x_axis: number[];
  series: { name: string; data: number[] }[];
}

const CustomLineChart: React.FC<CustomLineChartProps> = ({ x_axis, series }) => {
  return (
    <Box>
      <Typography variant="body2">Line Chart</Typography>
      <LineChart
        xAxis={[{ data: x_axis }]}
        series={series.map((s) => ({
          label: s.name,
          data: s.data,
        }))}
        height={300}
      />
    </Box>
  );
};

export default CustomLineChart;
