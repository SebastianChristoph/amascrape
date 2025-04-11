import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import ProductService from "../../services/ProductService";
import CustomLineChart from "../charts/CustomLineChart";
import { IoClose } from "react-icons/io5";

interface ProductChange {
  id: number;
  asin: string;
  title: string | null;
  price: number | null;
  main_category: string | null;
  second_category: string | null;
  main_category_rank: number | null;
  second_category_rank: number | null;
  change_date: string;
  changes: string;
  blm: number | null;
  total: number | null;
  img_path: string | null;
  store: string | null;
  manufacturer: string | null;
}

interface ProductDetailTableProps {
  productChanges: ProductChange[];
  formatCurrency: (value: number | null) => string;
  asin: string;
  onClose?: () => void;
}

interface ChartData {
  x_axis: string[];
  series: { name: string; data: number[] }[];
}

const ChangeIndicator = ({ current, previous }: { current: number | null, previous: number | null | undefined }) => {
  if (!current || !previous || current === previous) {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          ml: 1,
          visibility: 'hidden' // Hide but keep space
        }}
      />
    );
  }
  
  const increased = current > previous;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: increased ? 'success.main' : 'error.main',
        ml: 1,
      }}
    />
  );
};

const ValueWithChange = ({
  current,
  previous,
  formatValue = (v: number | null) => v?.toString() ?? '-',
  isInverseLogic = false,
}: {
  current: number | null;
  previous: number | null | undefined;
  formatValue?: (value: number | null) => string;
  isInverseLogic?: boolean;
}) => {
  if (current === null) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '80px' }}>
        <Typography sx={{ fontSize: 'inherit' }}>-</Typography>
        <ChangeIndicator current={null} previous={null} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '80px' }}>
      <Typography sx={{ fontSize: 'inherit' }}>
        {formatValue(current)}
      </Typography>
      <ChangeIndicator 
        current={isInverseLogic ? (current ? -current : null) : current} 
        previous={isInverseLogic ? (previous ? -previous : null) : previous} 
      />
    </Box>
  );
};

const displayValue = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return '-';
  const strValue = String(value);
  return strValue.trim() === '' ? '-' : strValue;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateString;
  }
};

const TruncatedText = ({ text }: { text: string | null }) => {
  if (!text) return <Typography sx={{ fontSize: 'inherit' }}>-</Typography>;
  
  const truncated = text.length > 20 ? `${text.substring(0, 20)}...` : text;
  
  return text.length > 20 ? (
    <Tooltip 
      title={text} 
      arrow
      PopperProps={{
        sx: {
          zIndex: 99999
        }
      }}
    >
      <Typography sx={{ fontSize: 'inherit' }}>{truncated}</Typography>
    </Tooltip>
  ) : (
    <Typography sx={{ fontSize: 'inherit' }}>{text}</Typography>
  );
};

const CategoryText = ({ text }: { text: string | null }) => {
  if (!text) return <Typography sx={{ fontSize: 'inherit' }}>-</Typography>;
  
  return text.length > 30 ? (
    <Box sx={{ 
      maxWidth: '200px',
      whiteSpace: 'normal',
      wordBreak: 'break-word'
    }}>
      <Tooltip 
        title={text} 
        arrow
        PopperProps={{
          sx: {
            zIndex: 99999
          }
        }}
      >
        <Typography sx={{ fontSize: 'inherit' }}>{text}</Typography>
      </Tooltip>
    </Box>
  ) : (
    <Typography sx={{ fontSize: 'inherit' }}>{text}</Typography>
  );
};

export default function ProductDetailTable({
  productChanges,
  formatCurrency,
  asin,
  onClose,
}: ProductDetailTableProps) {
  const theme = useTheme();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string>('price');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data = await ProductService.getProductChartData(asin);
        setChartData(data);
        console.log('Product Chart Data:', data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    if (asin) {
      fetchChartData();
    }
  }, [asin]);

  const handleSeriesChange = (event: React.MouseEvent<HTMLElement>, newSeries: string) => {
    if (newSeries !== null) {
      setSelectedSeries(newSeries);
    }
  };

  const getSelectedSeriesData = () => {
    if (!chartData) return [];
    
    if (selectedSeries === 'price_vs_rank') {
      const priceData = chartData.series.find(s => s.name === 'price');
      const rankData = chartData.series.find(s => s.name === 'main_category_rank');
      
      return [
        {
          ...priceData!,
          yAxisKey: 'price'
        },
        {
          ...rankData!,
          yAxisKey: 'rank'
        }
      ];
    }
    
    return [{
      ...chartData.series.find(s => s.name === selectedSeries)!,
      yAxisKey: 'price'
    }];
  };

  // Debug: Log the product changes
  console.log('Product Changes:', {
    length: productChanges.length,
    firstChange: productChanges[0],
    allChanges: productChanges
  });

  return (
    <Paper 
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.25)',
        maxWidth: '100%',
        width: '100%',
        position: 'relative',
        '& .MuiTableCell-root': {
          fontSize: '0.75rem',
          padding: '4px 8px',
        },
        '& .MuiTableCell-head': {
          fontWeight: 600,
          backgroundColor: theme.palette.background.paper,
          whiteSpace: 'nowrap',
        },
        '& .table-cell-changes': {
          minWidth: '400px',
          maxWidth: '600px',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        },
        '& .table-cell-nowrap': {
          whiteSpace: 'nowrap',
        },
        '& .table-cell-category': {
          minWidth: '150px',
          maxWidth: '200px',
        }
      }}
    >
      {/* Close Button */}
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 2,
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.text.primary,
            },
          }}
        >
          <IoClose size={24} />
        </IconButton>
      )}

      {/* Chart Section */}
      {chartData && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={selectedSeries}
              exclusive
              onChange={handleSeriesChange}
              aria-label="chart data selection"
            >
              {chartData.series.map((series) => (
                <ToggleButton 
                  key={series.name} 
                  value={series.name}
                  sx={{
                    textTransform: 'none',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                    },
                  }}
                >
                  {series.name === 'blm' ? 'Bought Last Month' :
                   series.name === 'main_category_rank' ? 'Main Category Rank' :
                   series.name === 'second_category_rank' ? 'Second Category Rank' :
                   'Price'}
                </ToggleButton>
              ))}
              <ToggleButton 
                value="price_vs_rank"
                sx={{
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    },
                  },
                }}
              >
                Price vs Rank
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <CustomLineChart
            x_axis={chartData.x_axis.map(date => new Date(date).getTime())}
            series={getSelectedSeriesData()}
            showDualAxis={selectedSeries === 'price_vs_rank'}
          />
        </Box>
      )}

      <TableContainer sx={{ maxHeight: '80vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell className="table-cell-nowrap">Change Date</TableCell>
              <TableCell className="table-cell-nowrap">Title</TableCell>
              <TableCell className="table-cell-nowrap">Image</TableCell>
              <TableCell className="table-cell-nowrap" align="right">Price</TableCell>
              <TableCell className="table-cell-category">Main Category</TableCell>
              <TableCell className="table-cell-category">Second Category</TableCell>
              <TableCell className="table-cell-nowrap" align="right">Main Rank</TableCell>
              <TableCell className="table-cell-nowrap" align="right">Second Rank</TableCell>
              <TableCell className="table-cell-nowrap" align="right">BLM</TableCell>
              <TableCell className="table-cell-nowrap" align="right">Total</TableCell>
              <TableCell className="table-cell-nowrap">Store</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productChanges.map((change, index) => {
              const previousChange = index < productChanges.length - 1 ? productChanges[index + 1] : undefined;
              
                return (
                <TableRow 
                  key={`${change.id}-${change.change_date}`}
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'action.hover',
                    },
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <TableCell className="table-cell-nowrap">{formatDate(change.change_date)}</TableCell>
                  <TableCell className="table-cell-nowrap">
                    <TruncatedText text={change.title} />
                  </TableCell>
                  <TableCell className="table-cell-nowrap">
                    {change.img_path ? (
                      <Box
                        component="img"
                        src={change.img_path}
                        alt={change.title || 'Product image'}
                        sx={{
                          width: '25px',
                          height: '25px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="table-cell-nowrap" align="right">
                        <ValueWithChange
                          current={change.price}
                          previous={previousChange?.price}
                          formatValue={formatCurrency}
                        />
                  </TableCell>
                  <TableCell className="table-cell-category">
                    <CategoryText text={change.main_category} />
                  </TableCell>
                  <TableCell className="table-cell-category">
                    <CategoryText text={change.second_category} />
                  </TableCell>
                  <TableCell className="table-cell-nowrap" align="right">
                        <ValueWithChange
                          current={change.main_category_rank}
                          previous={previousChange?.main_category_rank}
                          isInverseLogic={true}
                        />
                  </TableCell>
                  <TableCell className="table-cell-nowrap" align="right">
                        <ValueWithChange
                          current={change.second_category_rank}
                          previous={previousChange?.second_category_rank}
                          isInverseLogic={true}
                        />
                  </TableCell>
                  <TableCell className="table-cell-nowrap" align="right">
                        <ValueWithChange
                          current={change.blm}
                          previous={previousChange?.blm}
                        />
                  </TableCell>
                  <TableCell className="table-cell-nowrap" align="right">
                        <ValueWithChange
                          current={change.total}
                          previous={previousChange?.total}
                          formatValue={formatCurrency}
                        />
                  </TableCell>
                  <TableCell className="table-cell-nowrap">
                    <Tooltip 
                      title={change.manufacturer ? `Manufacturer: ${change.manufacturer}` : 'No manufacturer information'} 
                      arrow
                      PopperProps={{
                        sx: {
                          zIndex: 99999
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: 'inherit' }}>{displayValue(change.store)}</Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
