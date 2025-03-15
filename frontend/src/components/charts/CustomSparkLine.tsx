import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

interface CustomSparkLineProps {
  data?: number[]; // Optional, falls `undefined`
}

export default function CustomSparkLine({ data = [0] }: CustomSparkLineProps) {
  return (
    <Stack direction="row" sx={{ width: "100%", minWidth: 80, height: 50 }}> {/* ✅ minWidth & height hinzugefügt */}
      <Box sx={{ flexGrow: 1 }}>
        <SparkLineChart data={data.length > 0 ? data : [0]} height={50} /> {/* ✅ Sicherstellen, dass data immer Werte hat */}
      </Box>
    </Stack>
  );
}
