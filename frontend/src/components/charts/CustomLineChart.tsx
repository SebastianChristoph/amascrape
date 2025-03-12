import { LineChart } from "@mui/x-charts/LineChart/LineChart";


export default function CustomLineChart() {
  return (
    <LineChart
    xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
    series={[
      {
        data: [2, 5.5, 2, 8.5, 1.5, 5],
      },
    ]}
    width={500}
    height={300}
  />
  );
}