import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

interface CustomSparkLineProps {
  data?: number[];
}

export default function CustomSparkLine({ data = [0] }: CustomSparkLineProps) {
  return (
    <Stack direction="row" sx={{ width: "100%", minWidth: 80, height: 50 }}>
      <Box sx={{ flexGrow: 1 }}>
        <SparkLineChart data={data.length > 0 ? data : [0]} height={50} />
      </Box>
    </Stack>
  );
}
