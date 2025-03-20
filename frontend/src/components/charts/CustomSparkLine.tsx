import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { useTheme } from '@mui/material/styles';

interface CustomSparkLineProps {
  data?: number[];
}

export default function CustomSparkLine({ data = [0] }: CustomSparkLineProps) {
  const theme = useTheme();

  return (
    <Stack direction="row" sx={{ width: "100%", minWidth: 80, height: 50 }}>
      <Box sx={{ flexGrow: 1 }}>
        <SparkLineChart 
          data={data.length > 0 ? data : [0]} 
          height={50}
          curve="natural"
          sx={{
            '& .MuiChartsSparkLine-root': {
              stroke: theme.palette.secondary.main,
              strokeWidth: 2,
              fill: `${theme.palette.secondary.main}15`,
            },
            '& .MuiChartsSparkLine-line': {
              stroke: theme.palette.secondary.main,
            },
            '& .MuiChartsSparkLine-area': {
              fill: `${theme.palette.secondary.main}15`,
            }
          }}
        />
      </Box>
    </Stack>
  );
}
