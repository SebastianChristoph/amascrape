import * as React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

function generateRandomData(length: number, min: number = 1, max: number = 10): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

export default function CustomSparkLine() {
  const data = React.useMemo(() => generateRandomData(9), []);

  return (
    <Stack direction="row" sx={{ width: '100%' }}>
      <Box sx={{ flexGrow: 1 }}>
        <SparkLineChart data={data} height={100} />
      </Box>
    </Stack>
  );
}