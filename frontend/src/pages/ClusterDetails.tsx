import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaDollarSign,
  FaRegEye,
  FaStore,
  FaTrophy,
  FaSearch,
  FaBoxes,
  FaPercentage,
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import CustomSparkLine from "../components/charts/CustomSparkLine";
import CustomStackBars from "../components/charts/CustomStackChart";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import { FaCheckCircle, FaPlusCircle } from "react-icons/fa";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface MyProduct {
  id: string; // oder number, je nach DB
  title: string;
  price: number;
  image: string;
}

interface ProductType {
  asin: string; // ✅ Ändere 'id' zu 'asin'
  title: string;
  price: number;
  image: string;
  isMyProduct: boolean;
}

interface MarketType {
  id: number;
  keyword: string;
  products: ProductType[];
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
  const [userProductInsights, setUserProductInsights] = useState<any>(null);

  const API_URL = "http://localhost:9000"; // ✅ API Basis-URL
  const TOKEN_KEY = "token"; // ✅ Konstanter Schlüssel für den Token

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
        // 🔄 Alle API-Anfragen parallel abrufen
        const [clusterData, stackedData, userInsights, barData, myProducts] =
          await Promise.all([
            MarketService.getMarketClusterDetails(Number(clusterId)),
            ChartDataService.GetStackedBarDataForCluster(Number(clusterId)),
            fetch(`${API_URL}/user-products/insights/${clusterId}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
              },
            }).then((res) => res.json()),
            ChartDataService.GetBarChartData(),
            fetch(`${API_URL}/user-products/`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
              },
            }).then((res) => res.json()), // ✅ My Products abrufen
          ]);

        if (userInsights) {
          console.log("[DEBUG] userInsights:", userInsights);

          setUserProductInsights(userInsights);
        }

        if (clusterData) {
          console.log("[DEBUG] clusterData:", clusterData);

          // 🔍 Alle Produkte mit `isMyProduct` flaggen
          const updatedMarkets = clusterData.markets.map(
            (market: MarketType) => ({
              ...market,
              products: market.products.map((p: ProductType) => ({
                ...p,
                isMyProduct: myProducts.includes(p.asin), // ✅ Falls in My Products, setze `isMyProduct`
              })),
            })
          );

          setMarketCluster({ ...clusterData, markets: updatedMarkets });
        }

        if (stackedData) {
          console.log("[DEBUG] stackedData:", stackedData);
          setStackedChartData(transformStackedChartData(stackedData));
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

  const fetchUserProductInsights = async () => {
    try {
      const response = await fetch(
        `${API_URL}/user-products/insights/${clusterId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
          },
        }
      );
      const data = await response.json();
      setUserProductInsights(data);
    } catch (error) {
      console.error("Error fetching user product insights:", error);
    }
  };

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

  const toggleMyProduct = async (asin: string) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.error("User is not authenticated.");
        return;
      }

      const product = marketCluster.markets
        .flatMap((market: MarketType) => market.products)
        .find((p: ProductType) => p.asin === asin);

      if (!product) return;

      const apiUrl = `${API_URL}/user-products/${asin}`;
      const method = product.isMyProduct ? "DELETE" : "POST";

      await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedMarkets = marketCluster.markets.map(
        (market: MarketType) => ({
          ...market,
          products: market.products.map((p: ProductType) =>
            p.asin === asin ? { ...p, isMyProduct: !p.isMyProduct } : p
          ),
        })
      );

      setMarketCluster({ ...marketCluster, markets: updatedMarkets });

      await fetchUserProductInsights();
    } catch (error) {
      console.error("Error toggling MyProduct:", error);
    }
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
      field: "myProduct",
      headerName: "My Product",
      width: 150,
      renderCell: (params) => (
        <span
          onClick={() => toggleMyProduct(params.row.id)}
          style={{
            cursor: "pointer",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            color: params.row.isMyProduct ? "green" : "blue",
          }}
        >
          {params.row.isMyProduct ? (
            <>
              <FaCheckCircle style={{ marginRight: 4 }} />
              Remove from my product
            </>
          ) : (
            <>
              <FaPlusCircle style={{ marginRight: 4 }} />
              This is my product
            </>
          )}
        </span>
      ),
    },
    {
      field: "image",
      headerName: "Image",
      width: 40,
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
      field: "chart_price",
      headerName: "Price Trend",
      width: 100,
      renderCell: (params) => {
        return params.row.sparkline_price ? (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_price} />
          </Box>
        ) : (
          <Chip label="No Data" color="default" size="small" />
        );
      },
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
    {
      field: "store",
      headerName: "Store",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "manufacturer",
      headerName: "Manufacturer/Brand",
      width: 120,
      renderCell: (params) => renderWithNoData(params.value),
    },

    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 200,
      renderCell: (params) => renderWithNoData(params.value),
    },
    {
      field: "chart_main_rank",
      headerName: "Main Rank Trend",
      width: 100,
      renderCell: (params) => {
        return params.row.sparkline_main_rank &&
          params.row.sparkline_main_rank.length > 0 ? (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_main_rank} />
          </Box>
        ) : (
          <Chip label="No Data" color="default" size="small" />
        );
      },
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
      field: "chart_second_rank",
      headerName: "Second Rank Trend",
      width: 100,
      renderCell: (params) => {
        return params.row.sparkline_second_rank ? (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_second_rank} />
          </Box>
        ) : (
          <Chip label="No Data" color="default" size="small" />
        );
      },
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
      field: "chart_blm",
      headerName: "BLM Trend",
      width: 100,
      renderCell: (params) => {
        return params.row.sparkline_price ? (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_blm} />
          </Box>
        ) : (
          <Chip label="No Data" color="default" size="small" />
        );
      },
    },
    {
      field: "chart_total",
      headerName: "Total Trend",
      width: 100,
      renderCell: (params) => {
        return params.row.sparkline_price ? (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine data={params.row.sparkline_total} />
          </Box>
        ) : (
          <Chip label="No Data" color="default" size="small" />
        );
      },
    },
    {
      field: "total",
      headerName: "Total Revenue",
      type: "number",
      width: 150,
      renderCell: (params) => renderWithNoData(params.value, formatCurrency),
    },
  ];

  const allowedFields = ["details", "image", "title", "price"];
  
  const filteredColumns = marketCluster.is_initial_scraped
    ? columns // Falls `is_initial_scraped === true`, alle Spalten anzeigen
    : columns.filter(col => allowedFields.includes(col.field)); // Nur erlaubte Felder beibehalten
  
  return (
    <>
      <Paper elevation={1} sx={{ marginBottom: 2, padding: 4 }}>
        {(!marketCluster.is_initial_scraped) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This is a first impression of the market. More detailed data will be
            available after the initial scraping process (usually takes about one hour).
          </Alert>
        )}

        <Typography variant="h4" sx={{ marginBottom: 3, color: 'text.primary', fontWeight: 600 }}>
          {marketCluster.title}
        </Typography>

        <Grid container spacing={4}>
          {/* Market Development Chart - 1/3 width */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ height: "100%" }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Market Development
              </Typography>
              {Object.keys(stackedChartData).length === 0 ||
              Object.values(stackedChartData).every((marketData) =>
                marketData.every((entry) => entry.value === 0)
              ) ? (
                <Box sx={{ height: "100%" }}>
                  <Box
                    sx={{ position: "relative", height: "calc(100% - 40px)" }}
                  >
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width="100%"
                      height="100%"
                      sx={{
                        borderRadius: 1,
                        bgcolor: "grey.100",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        padding: "8px 16px",
                        borderRadius: 1,
                      }}
                    >
                      Historical market data will be available soon
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: "calc(100% - 40px)" }}>
                  <CustomStackBars data={stackedChartData} />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Market Metrics - 1/3 width */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Market Cluster Insights
            </Typography>
            <Grid container spacing={2}>
              {/* Total Revenue Card */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaDollarSign size={22} color="#1976d2" />
                  </Box>
                  <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Revenue
                      </Typography>

                      {marketCluster.is_initial_scraped ? (
                        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                          {formatCurrency(marketCluster.insights?.total_revenue || 0)}
                        </Typography>
                      ) : (
                        <Typography variant="h2">{<Skeleton /> }</Typography>

                      )}
                    </Box>
                </Paper>
              </Grid>

              {/* Markets & Products Card */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaStore size={22} color="#1976d2" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Markets & Products
                    </Typography>
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                      {marketCluster.insights?.total_markets || 0} Markets • {marketCluster.insights?.total_products || 0} Products
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Average Revenue Cards */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaChartLine size={22} color="#1976d2" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Average Revenue
                    </Typography>

                    {marketCluster.is_initial_scraped ? (
                      <Box>
                         <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                         Per Market: {formatCurrency(marketCluster.insights?.avg_revenue_per_market || 0)}
                       </Typography>
                       <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                         Per Product: {formatCurrency(marketCluster.insights?.avg_revenue_per_product || 0)}
                        </Typography>
                        </Box>
                      ) : (
                        <Typography variant="h2">{<Skeleton /> }</Typography>

                    )}
                    


                   
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* My Market Share - 1/3 width */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              My Market Share
            </Typography>
            <Grid container spacing={2}>
              {/* My Total Revenue Card */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaDollarSign size={22} color="#1976d2" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      My Total Revenue
                    </Typography>

                    {marketCluster.is_initial_scraped ? (
                        
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                    {formatCurrency(userProductInsights?.total_revenue_user_products || 0)}
                  </Typography>
                      ) : (
                        <Typography variant="h2">{<Skeleton /> }</Typography>

                    )}

                  
                  </Box>
                </Paper>
              </Grid>

              {/* Active Products Card */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaBoxes size={22} color="#1976d2" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      My Products
                    </Typography>
                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                      {userProductInsights?.user_product_count || 0}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Market Share Card */}
              <Grid size={12}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 45,
                      height: 45,
                      borderRadius: '12px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FaPercentage size={22} color="#1976d2" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      30-Day Trend
                    </Typography>

                    {marketCluster.is_initial_scraped ? (
                        
                        <Box sx={{ width: 120, height: 40, mt: 1 }}>
                        <CustomSparkLine
                          data={userProductInsights?.sparkline_data_user_products || []}
                        />
                      </Box>
                          ) : (
                            <Typography variant="h2">{<Skeleton /> }</Typography>
    
                    )}
                    
                    
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={4} sx={{ marginBottom: 2, padding: 4 }}>
       

        {/* <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <Box sx={{ width: "100%", height: 300 }}>
              {Object.keys(stackedChartData).length === 0 ||
              Object.values(stackedChartData).every((marketData) =>
                marketData.every((entry) => entry.value === 0)
              ) ? (
                <Box sx={{ height: "100%" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Development
                  </Typography>
                  <Box
                    sx={{ position: "relative", height: "calc(100% - 40px)" }}
                  >
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width="100%"
                      height="100%"
                      sx={{
                        borderRadius: 1,
                        bgcolor: "grey.100",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        padding: "8px 16px",
                        borderRadius: 1,
                      }}
                    >
                      Historical market data will be available soon
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: "100%" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Development
                  </Typography>
                  <Box sx={{ height: "calc(100% - 40px)" }}>
                    <CustomStackBars data={stackedChartData} />
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 8 }}>
            <Box sx={{ width: "100%", height: 300 }}>
              {!marketCluster.total_revenue ||
              marketCluster.total_revenue === 0 ? (
                <Box sx={{ height: "100%" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Cluster Insights
                  </Typography>
                  <Box
                    sx={{ position: "relative", height: "calc(100% - 40px)" }}
                  >
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width="100%"
                      height="100%"
                      sx={{
                        borderRadius: 1,
                        bgcolor: "grey.100",
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                        padding: "8px 16px",
                        borderRadius: 1,
                      }}
                    >
                      Insights will be available once data scraping is complete
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: "100%", overflow: "auto" }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Market Cluster Insights
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FaDollarSign size={16} color="#666" />
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Total Revenue
                            </Typography>
                          </Box>
                          <Typography variant="h4">
                            {formatCurrency(
                              marketCluster.insights?.total_revenue || 0
                            )}
                          </Typography>
                        </Box>

                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FaStore size={16} color="#666" />
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Markets & Products
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            {marketCluster.insights?.total_markets} Markets •{" "}
                            {marketCluster.insights?.total_products} Products
                          </Typography>
                        </Box>

                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FaChartLine size={16} color="#666" />
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Average Revenue
                            </Typography>
                          </Box>
                          <Typography variant="body1">
                            Per Market:{" "}
                            {formatCurrency(
                              marketCluster.insights?.avg_revenue_per_market ||
                                0
                            )}
                          </Typography>
                          <Typography variant="body1">
                            Per Product:{" "}
                            {formatCurrency(
                              marketCluster.insights?.avg_revenue_per_product ||
                                0
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FaTrophy size={16} color="#666" />
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              Top Performers
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: "medium" }}
                          >
                            Best Market:{" "}
                            {marketCluster.insights?.top_performing_market ||
                              "N/A"}
                          </Typography>
                          {marketCluster.insights?.top_performing_product
                            ?.title && (
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: "medium" }}
                              >
                                Best Product:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  wordBreak: "break-word",
                                  mb: 1,
                                }}
                              >
                                {marketCluster.insights?.top_performing_product
                                  .title.length > 50
                                  ? `${marketCluster.insights?.top_performing_product.title.substring(0, 50)}...`
                                  : marketCluster.insights
                                      ?.top_performing_product.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Revenue:{" "}
                                {formatCurrency(
                                  marketCluster.insights?.top_performing_product
                                    .revenue || 0
                                )}
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
        </Grid> */}

        {/* {userProductInsights && (
          <Paper sx={{ p: 2, mt: 4, mb: 3, backgroundColor: "#f8f9fa" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "primary.main", fontWeight: 500 }}
                  >
                    My Products Overview
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ pt: 0.5 }}>
                      <FaDollarSign size={16} color="#2196f3" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(
                          userProductInsights.total_revenue_user_products
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ pt: 0.5 }}>
                      <FaStore size={16} color="#2196f3" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Active Products
                      </Typography>
                      <Typography variant="h6">
                        {userProductInsights.user_product_count}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Box sx={{ pt: 0.5 }}>
                      <FaChartLine size={16} color="#2196f3" />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        30-Day Trend
                      </Typography>
                      <Box sx={{ width: 120, height: 40 }}>
                        <CustomSparkLine
                          data={
                            userProductInsights.sparkline_data_user_products
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )} */}

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
                p: 4,
                my: 2,
                backgroundColor: "#fff",
                borderRadius: 2,
              }}
            >
              {!marketCluster.is_initial_scraped ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  Once scraping is complete, market revenue, matreics and product data will be calculated and presented here
                </Alert>
              ) : (
                <>
                  <Grid container spacing={4}>
                    {/* Left side - Market Metrics */}
                    <Grid size={{ xs: 12, md: 6 }} >
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Market Metrics
                      </Typography>
                      <Grid container spacing={2}  sx={{height: 160}}>
                        {/* Market Revenue Card */}
                        <Grid size={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 3,
                              height: '100%',
                              backgroundColor: 'white',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 45,
                                height: 45,
                                borderRadius: '12px',
                                backgroundColor: '#e3f2fd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FaDollarSign size={22} color="#1976d2" />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Market Revenue
                              </Typography>
                              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                {formatCurrency(market.revenue_total || 0)}
                              </Typography>
                              {market.sparkline_data_total_revenue && market.sparkline_data_total_revenue.length > 0 && (
                                <Box sx={{ width: 120, height: 40, mt: 1 }}>
                                  <CustomSparkLine data={market.sparkline_data_total_revenue} />
                                </Box>
                              )}
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Most Expensive Card */}
                        <Grid size={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 3,
                              height: '100%',
                              backgroundColor: 'white',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 45,
                                height: 45,
                                borderRadius: '12px',
                                backgroundColor: '#e3f2fd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FaTrophy size={22} color="#1976d2" />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Most Expensive
                              </Typography>
                              {(() => {
                                const maxPriceProduct = market.products.reduce(
                                  (max: any, p: any) =>
                                    !max || (p.price || 0) > (max.price || 0)
                                      ? p
                                      : max,
                                  null
                                );
                                return (
                                  <Link
                                    href={`https://www.amazon.com/dp/${maxPriceProduct?.asin}?language=en_US`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ textDecoration: "none" }}
                                  >
                                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                      {formatCurrency(maxPriceProduct?.price || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {maxPriceProduct?.asin || "N/A"}
                                    </Typography>
                                  </Link>
                                );
                              })()}
                            </Box>
                          </Paper>
                        </Grid>

                        {/* Least Expensive Card */}
                        <Grid size={4}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 3,
                              height: '100%',
                              backgroundColor: 'white',
                              borderRadius: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 45,
                                height: 45,
                                borderRadius: '12px',
                                backgroundColor: '#e3f2fd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <FaStore size={22} color="#1976d2" />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Least Expensive
                              </Typography>
                              {(() => {
                                const minPriceProduct = market.products
                                  .filter((p: any) => p.price > 0)
                                  .reduce(
                                    (min: any, p: any) =>
                                      !min || p.price < min.price ? p : min,
                                    null
                                  );
                                return (
                                  <Link
                                    href={`https://www.amazon.com/dp/${minPriceProduct?.asin}?language=en_US`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ textDecoration: "none" }}
                                  >
                                    <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                      {formatCurrency(minPriceProduct?.price || 0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {minPriceProduct?.asin || "N/A"}
                                    </Typography>
                                  </Link>
                                );
                              })()}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Right side - My Market Share */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        My Market Share
                      </Typography>
                      <Grid container spacing={2}>
                        {userProductInsights?.markets?.find(
                          (m: any) => m.market_id === market.id
                        ) ? (
                          <>
                            {/* Products Card */}
                            <Grid size={4}>
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 3,
                                  height: '100%',
                                  backgroundColor: 'white',
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 45,
                                    height: 45,
                                    borderRadius: '12px',
                                    backgroundColor: '#e3f2fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <FaBoxes size={22} color="#1976d2" />
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Products
                                  </Typography>
                                  <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                    {userProductInsights.markets.find(
                                      (m: any) => m.market_id === market.id
                                    )?.user_product_count || 0}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>

                            {/* Total Revenue Card */}
                            <Grid size={4} sx={{height: 160}}>
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 3,
                                  height: '100%',
                                  backgroundColor: 'white',
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 45,
                                    height: 45,
                                    borderRadius: '12px',
                                    backgroundColor: '#e3f2fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <FaDollarSign size={22} color="#1976d2" />
                                </Box>
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Total Revenue
                                  </Typography>
                                  <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(
                                      userProductInsights.markets.find(
                                        (m: any) => m.market_id === market.id
                                      )?.total_revenue_user_products || 0
                                    )}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          </>
                        ) : (
                          <Grid size={12}>
                            <Paper
                              elevation={1}
                              sx={{
                                p: 3,
                                height: '100%',
                                backgroundColor: '#f5f5f5',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="body1" color="text.secondary">
                                No products in this market yet
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Top Suggestions - Full Width */}
                  <Box sx={{ mt: 4 }}>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <FaSearch size={16} />
                      Top Suggestions
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {market.top_suggestions
                        .split(",")
                        .map((suggestion: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={suggestion.trim()}
                            variant="filled"
                            color="primary"
                            size="small"
                            sx={{
                          
                              borderRadius: "16px",
                              cursor: "pointer",
                              height: "32px",
                              fontSize: "0.875rem",
                              fontWeight: 400,
                              backgroundColor: "primary.main",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "primary.dark", transform: 'translateY(-4px)',
                              },
                              "& .MuiChip-label": {
                                padding: "0 12px",
                              },transition: 'transform 0.2s',
                  
                            }}
                          />
                        ))}
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
            <Box sx={{ height: "800px", width: "100%" }}>
            <DataGrid
              rows={market.products.map((product: any) => ({
                id: product.asin,
                image: product.image,
                title: product.title,
                price: product.price,
                manufacturer: product.manufacturer,
                store: product.store,
                mainCategory: product.main_category,
                mainCategoryRank: product.main_category_rank,
                secondCategory: product.second_category,
                secondCategoryRank: product.second_category_rank,
                blm: product.blm,
                total: product.total,
                sparkline_main_rank: product.sparkline_main_rank,
                sparkline_second_rank: product.sparkline_second_rank,
                sparkline_price: product.sparkline_price,
                sparkline_total: product.sparkline_total,
                sparkline_blm: product.sparkline_blm,
                isMyProduct: product.isMyProduct, // ✅ Status für Zeilen-Highlight
              }))}
              columns={filteredColumns}
              rowHeight={55}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection={false}
              getRowClassName={(params) =>
                params.row.isMyProduct ? "my-product-row" : ""
              }
            />
              </Box>
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
