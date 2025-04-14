import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { useTheme } from "@mui/material/styles";
import { Tooltip } from "@mui/material";

interface CustomSparkLineProps {
  data?: number[];
  onClick?: () => void;
}

// Glattere Random-Daten – simuliert z.B. eine kontinuierliche Entwicklung
const generateSmoothRandomData = (length: number = 30, start: number = 50): number[] => {
  const result = [start];
  for (let i = 1; i < length; i++) {
    const previous = result[i - 1];
    // leichte Veränderung: max +/- 5
    const change = Math.floor(Math.random() * 11) - 5;
    result.push(Math.max(0, previous + change)); // nie < 0
  }
  return result;
};

export default function CustomSparkLine({ data, onClick }: CustomSparkLineProps) {
  const theme = useTheme();

  const isProvided = Array.isArray(data) && data.length > 0;
  const sparklineData = isProvided ? data : generateSmoothRandomData();
  const sparklineColor = isProvided
    ? theme.palette.accent.main
    : theme.palette.primary.main;

  const tooltipTitle = isProvided ? "Valid Data" : "No Data, generated with random data";

  return (
    <Stack
      direction="row"
      sx={{
        width: "100%",
        minWidth: 40,
        height: 40,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      <Tooltip title={tooltipTitle}>
        <Box sx={{ flexGrow: 1 }}>
          <SparkLineChart
            data={sparklineData}
            height={40}
            showTooltip={false}
            curve="linear"
            colors={[sparklineColor]}
            slotProps={{
              line: {
                strokeWidth: 1,
              },
            }}
          />
        </Box>
      </Tooltip>
    </Stack>
  );
}
