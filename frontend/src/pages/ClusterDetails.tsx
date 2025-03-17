import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Skeleton,
  styled,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CustomBarChart from "../components/charts/CustomBarChart";
import CustomSparkLine from "../components/charts/CustomSparkLine";
import CustomStackBars from "../components/charts/CustomStackChart";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import { FaRegEye, FaDollarSign, FaStore, FaChartLine, FaTrophy } from "react-icons/fa";
import { GrCluster } from "react-icons/gr";
import { AiOutlineCheckCircle } from "react-icons/ai";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export default function ClusterDetails() {
  const { clusterId } = useParams();
  const [marketCluster, setMarketCluster] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [stackedChartData, setStackedChartData] = useState<
    Record<string, { date: string; value: number }[]>
  >({});

  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [productChanges, setProductChanges] = useState<any[]>([]);
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);

  const ItemCard = styled(Card)(({ theme }) => ({
    minHeight: 400,
    backgroundColor: "#fff",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "start",
    color: theme.palette.text.secondary,
    ...theme.applyStyles("dark", {
      backgroundColor: "#1A2027",
    }),
  }));

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      value
    );
  };

  const handleShowDetails = async (asin: string) => {
    setSelectedAsin(asin);
    setOpenBackdrop(true);

    try {
      const changes = await MarketService.getProductChanges(asin);
      setProductChanges(changes);
    } catch (error) {
      console.error("Fehler beim Laden der Produktänderungen:", error);
    }
  };

  const handleCloseBackdrop = () => {
    setOpenBackdrop(false);
    setProductChanges([]);
  };

  const transformStackedChartData = (
    data: Record<string, { date: number; value: number }[]>
  ): Record<string, { date: string; value: number }[]> => {
    const transformedData: Record<string, { date: string; value: number }[]> =
      {};

    Object.keys(data).forEach((market) => {
      transformedData[market] = data[market].map((entry) => ({
        date: new Date((entry.date - 719163) * 86400000)
          .toISOString()
          .split("T")[0],
        value: entry.value,
      }));
    });

    return transformedData;
  };

  useEffect(() => {
    async function fetchAllData() {
      if (!clusterId) return;

      setLoading(true);

      try {
        const [clusterData, stackedData, barData] = await Promise.all([
          MarketService.getMarketClusterDetails(Number(clusterId)),
          ChartDataService.GetStackedBarDataForCluster(Number(clusterId)),
          ChartDataService.GetBarChartData(),
        ]);

        if (clusterData) setMarketCluster(clusterData);
        if (stackedData) {
          const transformedData = transformStackedChartData(stackedData);
          setStackedChartData(transformedData);
        }
        if (barData) setBarChartData(barData.barChart);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [clusterId]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={80} color="primary" />
      </Box>
    );
  }

  if (
    !marketCluster ||
    !marketCluster.markets ||
    marketCluster.markets.length === 0
  ) {
    return (
      <Paper
        sx={{
          p: 2,
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        elevation={6}
      >
        <Alert severity="warning">
          Market Cluster not found or restricted for you.
        </Alert>
      </Paper>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const renderWithNoData = (value: any, formatter?: (val: any) => any) => {
    if (value === null || value === undefined || value === "") {
      return <Chip label="No Data" color="default" size="small" />;
    }
    return formatter ? formatter(value) : value;
  };

  const columns: GridColDef[] = [
    {
      field: "details",
      headerName: "Details",
      width: 30,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleShowDetails(params.row.id)}
          sx={{ padding: 0, color: "primary.main" }}
        >
          <FaRegEye size={20} />
        </IconButton>
      ),
    },
    {
      field: "image",
      headerName: "Image",
      width: 80,
      renderCell: (params) =>
        params.value ? (
          <Link
            href={`https://www.amazon.com/dp/${params.row.id}?language=en_US`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={params.value}
              alt="Product"
              style={{ width: "100%", objectFit: "fill", cursor: "pointer" }}
            />
          </Link>
        ) : (
          <Chip label="No Image" color="default" size="small" />
        ),
    },
    {
      field: "id",
      headerName: "ASIN",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <Link
            href={`https://www.amazon.com/dp/${params.value}?language=en_US`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value}
          </Link>
        ) : (
          <Chip label="No ASIN" color="default" size="small" />
        ),
    },
    { field: "title", headerName: "Title", width: 400 },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
    {
      field: "chart",
      headerName: "Chart",
      width: 100,
      renderCell: (params) => {
        const [sparklineData, setSparklineData] = useState<number[] | null>(null);
  
        useEffect(() => {
          async function fetchSparkline() {
            const response = await ChartDataService.GetSparkLineGridData(
              params.row.id
            );
            setSparklineData(response || [0]);
          }
          fetchSparkline();
        }, [params.row.id]);
  
        return sparklineData ? (
          <Box sx={{ mt: 4 }}>
            <CustomSparkLine data={sparklineData} />
          </Box>
        ) : (
          <Chip label="No Chart" color="default" size="small" />
        );
      },
    },
    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "mainCategoryRank",
      headerName: "Rank Main",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "secondCategory",
      headerName: "Sub Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "secondCategoryRank",
      headerName: "Sub Rank",
      width: 100,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "blm",
      headerName: "Bought Last Month",
      type: "number",
      width: 130,
      renderCell: (params) => renderWithNoData(params.value, formatNumber),
    },
    {
      field: "total",
      headerName: "Total Revenue",
      type: "number",
      width: 150,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
  ];
  
  return (
    <>
      <Paper elevation={4} sx={{ marginBottom: 2, padding: 4 }}>
        <Typography
          sx={{
            mt: 4,
            mb: 4,
            backgroundColor: "primary.main",
            color: "white",
            padding: 2,
          }}
          variant="h5"
        >
          Market Cluster Data
        </Typography>
  
        {(!marketCluster.total_revenue || marketCluster.total_revenue === 0) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a first impression of the market. More detailed data will be available after the initial scraping process (usually takes about one day).
          </Alert>
        )}
  
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          {marketCluster.title}
        </Typography>
  
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <Box sx={{ width: '100%', height: 300 }}>
              {Object.keys(stackedChartData).length === 0 || 
               Object.values(stackedChartData).every(marketData => 
                 marketData.every(entry => entry.value === 0)
               ) ? (
                <Box sx={{ height: '100%' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Development
                  </Typography>
                  <Box sx={{ position: 'relative', height: 'calc(100% - 40px)' }}>
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave"
                      width="100%" 
                      height="100%"
                      sx={{
                        borderRadius: 1,
                        bgcolor: 'grey.100'
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '8px 16px',
                        borderRadius: 1
                      }}
                    >
                      Historical market data will be available soon
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: '100%' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Development
                  </Typography>
                  <Box sx={{ height: 'calc(100% - 40px)' }}>
                    <CustomStackBars data={stackedChartData} />
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 8 }}>
            <Box sx={{ width: '100%', height: 300 }}>
              {!marketCluster.total_revenue || marketCluster.total_revenue === 0 ? (
                <Box sx={{ height: '100%' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Cluster Insights
                  </Typography>
                  <Box sx={{ position: 'relative', height: 'calc(100% - 40px)' }}>
                    <Skeleton 
                      variant="rectangular" 
                      animation="wave"
                      width="100%" 
                      height="100%"
                      sx={{
                        borderRadius: 1,
                        bgcolor: 'grey.100'
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: '8px 16px',
                        borderRadius: 1
                      }}
                    >
                      Insights will be available once data scraping is complete
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Cluster Insights
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaDollarSign size={16} color="#666" />
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Revenue
                            </Typography>
                          </Box>
                          <Typography variant="h4">
                            {formatCurrency(marketCluster.insights?.total_revenue || 0)}
                          </Typography>
                        </Box>

                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaStore size={16} color="#666" />
                            <Typography variant="subtitle2" color="text.secondary">
                              Markets & Products
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {marketCluster.insights?.total_markets} Markets • {marketCluster.insights?.total_products} Products
                          </Typography>
                        </Box>

                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaChartLine size={16} color="#666" />
                            <Typography variant="subtitle2" color="text.secondary">
                              Average Revenue
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            Per Market: {formatCurrency(marketCluster.insights?.avg_revenue_per_market || 0)}
                          </Typography>
                          <Typography variant="body1">
                            Per Product: {formatCurrency(marketCluster.insights?.avg_revenue_per_product || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaTrophy size={16} color="#666" />
                            <Typography variant="subtitle2" color="text.secondary">
                              Top Performers
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            Best Market: {marketCluster.insights?.top_performing_market || 'N/A'}
                          </Typography>
                          {marketCluster.insights?.top_performing_product?.title && (
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                Best Product: 
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                wordBreak: 'break-word',
                                mb: 1
                              }}>
                                {marketCluster.insights?.top_performing_product.title.length > 50 
                                  ? `${marketCluster.insights?.top_performing_product.title.substring(0, 50)}...`
                                  : marketCluster.insights?.top_performing_product.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Revenue: {formatCurrency(marketCluster.insights?.top_performing_product.revenue || 0)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
  
        <Typography
          sx={{
            mt: 4,
            mb: 2,
            backgroundColor: "primary.main",
            color: "white",
            padding: 2,
          }}
          variant="h5"
        >
          Markets in {marketCluster.title}
        </Typography>
  
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabIndex} onChange={handleTabChange}>
            {marketCluster.markets.map((market: any, index: number) => (
              <Tab
                sx={{ fontSize: 22 }}
                key={market.id}
                label={market.keyword}
              />
            ))}
          </Tabs>
        </Box>
  
        {marketCluster.markets.map((market: any, index: number) => (
          <Box
            key={market.id}
            sx={{
              minHeight: 500,
              width: "100%",
              mt: 3,
              display: tabIndex === index ? "block" : "none",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 2,
                my: 2,
                backgroundColor: "#f5f5f5",
                borderRadius: 2,
              }}
            >
              {!market.revenue_total || market.revenue_total === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Market revenue will be calculated once product data scraping is complete
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Market Revenue</Typography>
                    <Typography variant="h6">
                      {formatCurrency(market.revenue_total || 0)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Most Expensive</Typography>
                    <Typography variant="h6">
                      {(() => {
                        const maxPriceProduct = market.products.reduce((max: any, p: any) => 
                          (!max || (p.price || 0) > (max.price || 0)) ? p : max, null);
                        return `${formatCurrency(maxPriceProduct?.price || 0)} (${maxPriceProduct?.asin || 'N/A'})`;
                      })()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Least Expensive</Typography>
                    <Typography variant="h6">
                      {(() => {
                        const minPriceProduct = market.products
                          .filter((p: any) => p.price > 0)
                          .reduce((min: any, p: any) => 
                            (!min || p.price < min.price) ? p : min, null);
                        return `${formatCurrency(minPriceProduct?.price || 0)} (${minPriceProduct?.asin || 'N/A'})`;
                      })()}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">Highest Revenue Product</Typography>
                    <Typography variant="h6">
                      {(() => {
                        const maxRevenueProduct = market.products.reduce((max: any, p: any) => 
                          (!max || (p.total || 0) > (max.total || 0)) ? p : max, null);
                        return `${formatCurrency(maxRevenueProduct?.total || 0)} (${maxRevenueProduct?.asin || 'N/A'})`;
                      })()}
                    </Typography>
                  </Grid>
                </Grid>
              )}

              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                🔍 Top Suggestions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {market.top_suggestions.split(",").map((suggestion: string, idx: number) => (
                  <Chip key={idx} label={suggestion.trim()} variant="outlined" color="primary" />
                ))}
              </Box>
            </Paper>
            <DataGrid
              rows={market.products.map((product: any) => ({
                id: product.asin,
                image: product.image,
                title: product.title,
                price: product.price,
                mainCategory: product.main_category,
                mainCategoryRank: product.main_category_rank,
                secondCategory: product.second_category,
                secondCategoryRank: product.second_category_rank,
                blm: product.blm,
                total: product.total,
                sparkline_data: product.sparkline_data ?? [0],
              }))}
              columns={columns}
              rowHeight={100}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection={false}
            />
          </Box>
        ))}
      </Paper>
  
      <Backdrop open={openBackdrop} onClick={handleCloseBackdrop}>
        <TableContainer
          component={Paper}
          sx={{ maxWidth: "80vw", maxHeight: "80vh", overflowY: "auto" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Change Date</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Main Category</TableCell>
                <TableCell>Sub Category</TableCell>
                <TableCell>Rank (Main)</TableCell>
                <TableCell>Rank (Sub)</TableCell>
                <TableCell>BLM</TableCell>
                <TableCell>Total Revenue</TableCell>
                <TableCell>Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productChanges.length > 0 ? (
                productChanges.map((change, index) => (
                  <TableRow key={index}>
                    <TableCell>{change.change_date}</TableCell>
                    <TableCell>{change.title || "-"}</TableCell>
                    <TableCell>
                      {change.price ? formatCurrency(change.price) : "-"}
                    </TableCell>
                    <TableCell>{change.main_category || "-"}</TableCell>
                    <TableCell>{change.second_category || "-"}</TableCell>
                    <TableCell>{change.main_category_rank || "-"}</TableCell>
                    <TableCell>{change.second_category_rank || "-"}</TableCell>
                    <TableCell>{change.blm || "-"}</TableCell>
                    <TableCell>
                      {change.total ? formatCurrency(change.total) : "-"}
                    </TableCell>
                    <TableCell>{change.changes || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No Product Changes Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Backdrop>
    </>
  );
  
}
