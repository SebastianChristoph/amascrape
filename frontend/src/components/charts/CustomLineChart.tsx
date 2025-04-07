import { Box } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart/LineChart";

interface CustomLineChartProps {
  x_axis: number[];
  series: { name: string; data: number[]; yAxisKey: string }[];
  showDualAxis?: boolean;
}

const CustomLineChart: React.FC<CustomLineChartProps> = ({
  x_axis,
  series,
  showDualAxis = false
}) => {
  // Format date to DD.MM.YY
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Value formatter for tooltip
  const formatValue = (value: number | null, seriesName: string) => {
    if (value === null) return '-';
    
    switch(seriesName) {
      case 'price':
        return `$${value.toFixed(2)}`;
      case 'blm':
        return value.toLocaleString();
      case 'main_category_rank':
      case 'second_category_rank':
        return `#${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  // Calculate min and max values for y-axes
  const priceValues = series.filter(s => s.yAxisKey === 'price').flatMap(s => s.data);
  const rankValues = series.filter(s => s.yAxisKey === 'rank').flatMap(s => s.data);

  const priceMin = Math.min(...(priceValues.length ? priceValues : [0]));
  const priceMax = Math.max(...(priceValues.length ? priceValues : [0]));
  const rankMin = Math.min(...(rankValues.length ? rankValues : [0]));
  const rankMax = Math.max(...(rankValues.length ? rankValues : [0]));

  const pricePadding = (priceMax - priceMin) * 0.1;
  const rankPadding = (rankMax - rankMin) * 0.1;

  // Helper function to get the appropriate y-axis label
  const getAxisLabel = (seriesName: string) => {
    switch(seriesName) {
      case 'price': return 'Price ($)';
      case 'blm': return 'Units';
      case 'main_category_rank': return 'Rank';
      case 'second_category_rank': return 'Rank';
      default: return '';
    }
  };

  const yAxes = showDualAxis ? [
    {
      id: 'price',
      min: Math.floor(priceMin - pricePadding),
      max: Math.ceil(priceMax + pricePadding),
      label: 'Price ($)',
      position: 'left' as const,
      labelStyle: {
        transform: 'rotate(-90deg) translateX(-10px) translateY(-10px)'
      },
      tickLabelStyle: {
        fontSize: 12
      }
    },
    {
      id: 'rank',
      min: Math.floor(rankMin - rankPadding),
      max: Math.ceil(rankMax + rankPadding),
      position: 'right' as const,
      label: 'Rank',
      labelStyle: {
        transform: 'rotate(-90deg) translateX(10px) translateY(-10px)'
      },
      tickLabelStyle: {
        fontSize: 12
      }
    }
  ] : [
    {
      id: 'price',
      min: Math.floor(series[0]?.data ? Math.min(...series[0].data) - pricePadding : 0),
      max: Math.ceil(series[0]?.data ? Math.max(...series[0].data) + pricePadding : 100),
      label: getAxisLabel(series[0]?.name || ''),
      position: 'left' as const,
      labelStyle: {
        transform: 'rotate(-90deg) translateX(-10px) translateY(-10px)'
      },
      tickLabelStyle: {
        fontSize: 12
      }
    }
  ];

  return (
    <Box>
      <LineChart
        xAxis={[{ 
          data: x_axis,
          tickLabelStyle: {
            angle: 45,
            textAnchor: 'start',
            fontSize: 12
          },
          valueFormatter: formatDate
        }]}
        yAxis={yAxes}
        series={series.map((s) => ({
          label: s.name === 'price' ? 'Price' : 'Main Category Rank',
          data: s.data,
          curve: "stepAfter",
          showInLegend: showDualAxis,
          yAxisKey: s.yAxisKey,
          color: s.yAxisKey === 'price' ? '#2196f3' : '#4caf50',
          valueFormatter: (value: number | null) => formatValue(value, s.name)
        }))}
        height={300}
        margin={{ 
          left: 45,
          right: 45,
          top: 40,
          bottom: 50 
        }}
        disableAxisListener={false}
        slotProps={{
          legend: {
            hidden: !showDualAxis,
            position: {
              vertical: 'top',
              horizontal: 'right'
            },
            padding: 20,
            itemMarkWidth: 10,
            markGap: 5,
            itemGap: 10
          }
        }}
        tooltip={{
          trigger: 'axis'
        }}
        sx={{
          '.MuiTooltip-root': {
            zIndex: 9999,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            '& .MuiMarkElement-root': {
              width: '8px',
              height: '8px'
            }
          }
        }}
      />
    </Box>
  );
};

export default CustomLineChart;
