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
import { FaRegEye, FaSearch } from "react-icons/fa";
import { useParams } from "react-router-dom";
import CustomSparkLine from "../components/charts/CustomSparkLine";
import CustomStackBars from "../components/charts/CustomStackChart";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import { FaCheckCircle, FaPlusCircle } from "react-icons/fa";
import { useSnackbar } from "../providers/SnackbarProvider";
import { iconMap, fallbackIcon } from "../utils/iconUtils";
import { useTheme } from "@mui/material/styles";
import { IoStatsChart } from "react-icons/io5";
import MetricCardLarge from "../components/details/MetricCardLarge";
import MetricCardSmall from "../components/details/MetricCardSmall";
import PrimaryLineDivider from "../components/PrimaryLineDivider";
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
  const { showSnackbar } = useSnackbar();

  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [productChanges, setProductChanges] = useState<any[]>([]);
  const [selectedAsin, setSelectedAsin] = useState<string | null>(null);
  const [userProductInsights, setUserProductInsights] = useState<any>(null);

  const [addAsinDialogOpen, setAddAsinDialogOpen] = useState(false);
  const [newAsin, setNewAsin] = useState("");
  const [addingAsin, setAddingAsin] = useState(false);
  const [asinError, setAsinError] = useState<string | null>(null);

  const API_URL = "http://localhost:9000"; // ✅ API Basis-URL
  const TOKEN_KEY = "token"; // ✅ Konstanter Schlüssel für den Token
  const IconComponent = iconMap[marketCluster?.cluster_type] || fallbackIcon;
  const IconMarkets = iconMap["markets"] || fallbackIcon;

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const isValidAsin = (asin: string) =>
    /^B[A-Z0-9]{9}$/.test(asin.trim().toUpperCase());
  const theme = useTheme();

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
        const [clusterData, stackedData, userInsights, myProducts] =
          await Promise.all([
            MarketService.getMarketClusterDetails(Number(clusterId)),
            ChartDataService.GetStackedBarDataForCluster(Number(clusterId)),
            fetch(`${API_URL}/user-products/insights/${clusterId}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
              },
            }).then((res) => res.json()),

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
    : columns.filter((col) => allowedFields.includes(col.field)); // Nur erlaubte Felder beibehalten

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {!marketCluster.is_initial_scraped && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This is a first impression of the market. More detailed data will be
            available after the initial scraping process (usually takes about
            one hour).
          </Alert>
        )}

        <Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "baseline" }}>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent size={22} color={theme.palette.secondary.main} />
            </Box>
            <Typography
              variant="h1"
              sx={{ marginBottom: 3, color: "text.secondary", fontWeight: 600 }}
            >
              {marketCluster.title}
            </Typography>
            <Typography variant="caption">
              {" "}
              ({marketCluster.cluster_type} cluster)
            </Typography>
          </Box>
          <PrimaryLineDivider />
        </Box>
        {/* Cluster Insights */}
        <Grid container spacing={4}>
          {/* Market Development Chart - 1/3 width */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                // height: "100%",
                backgroundColor: "background.paper",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                },
                "&:hover .card-id": {
                  opacity: 1,
                },
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "flex-start",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IoStatsChart
                    size={22}
                    color={theme.palette.secondary.main}
                  />
                </Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  30D Trend
                </Typography>
              </Box>
              <Box>
                {Object.keys(stackedChartData).length === 0 ||
                Object.values(stackedChartData).every((marketData) =>
                  marketData.every((entry) => entry.value === 0)
                ) ? (
                  <Box>
                    <Box sx={{ position: "relative" }}>
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
                  <Box>
                    <CustomStackBars data={stackedChartData} />
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <MetricCardLarge
                iconKey="insight"
                title="Cluster Insights"
                value="123"
                cardId="CD1"
                isCurrency
              />

              <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                <MetricCardSmall
                  iconKey="markets"
                  title="Markets"
                  value="123"
                  cardId="CDD1"
                />
                <MetricCardSmall
                  iconKey="products"
                  title="Products"
                  value="123"
                  cardId="CDD2"
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                <MetricCardSmall
                  iconKey="static"
                  title="Metric3"
                  value="123"
                  cardId="CDD3"
                />
                <MetricCardSmall
                  iconKey="static"
                  title="Metric4"
                  value="123"
                  cardId="CDD4"
                />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <MetricCardLarge
                iconKey="products"
                title="My Products"
                value="123"
                cardId="CD2"
                isCurrency
              />

              <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                <MetricCardSmall
                  iconKey="percent"
                  title="Marketshare"
                  value="0.45%"
                  cardId="CDD5"
                />
              </Box>
              <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                <MetricCardSmall
                  iconKey="products"
                  title="Products"
                  value="123"
                  cardId="CDD6"
                />
                <MetricCardSmall
                  iconKey="static"
                  title="Metric3"
                  value="123"
                  cardId="CDD7"
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "baseline", mb: 4 }}>
            <Box
              sx={{
                width: 45,
                height: 45,
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconMarkets size={22} color={theme.palette.secondary.main} />
            </Box>
            
            <Typography variant="h1">
              Markets in {marketCluster.title}
            </Typography>
           
          </Box>
          <PrimaryLineDivider />

          
        


          <Box sx={{ borderBottom: 1, borderColor: "divider" , mt:6}}>
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
              {/* Market Insights */}
              <Grid container spacing={2} alignItems="stretch">
                <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
                  <Box sx={{ flex: 1 }}>
                    <MetricCardLarge
                      iconKey="insight"
                      title="Market Insights"
                      value="123"
                      cardId="DDM1"
                      isCurrency
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      width: "100%",
                      flex: 1,
                    }}
                  >
                    <MetricCardSmall
                      iconKey="products"
                      title="Products"
                      value="123"
                      cardId="DDM2"
                    />
                    <MetricCardSmall
                      iconKey="static"
                      title="AVG"
                      value="123"
                      cardId="DDM3"
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
                  <Box>
                    <MetricCardLarge
                      iconKey="products"
                      title="My Products"
                      value="123"
                      cardId="DDM4"
                      isCurrency
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex" }}>
                  <Box sx={{ flex: 1 }}>
                    <MetricCardLarge
                      iconKey="percent"
                      title="My Marketshare"
                      value="3,52%"
                      cardId="DDM5"
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      width: "100%",
                      flex: 1,
                    }}
                  >
                    <MetricCardSmall
                      iconKey="products"
                      title="Products"
                      value="123"
                      cardId="DDM6"
                    />
                    <MetricCardSmall
                      iconKey="static"
                      title="Metric2"
                      value="123"
                      cardId="DDM7"
                    />
                  </Box>
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
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{
                          borderRadius: "16px",

                          height: "32px",
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          borderColor: "secondary.main",
                          color: "text.secondary",
                          "&:hover": {
                            backgroundColor: "primary.dark",
                            transform: "translateY(-4px)",
                          },
                          "& .MuiChip-label": {
                            padding: "0 12px",
                          },
                          transition: "transform 0.2s",
                        }}
                      />
                    ))}
                </Box>
              </Box>

              {/* <Button
                onClick={() => {
                  setNewAsin("");
                  setAddAsinDialogOpen(true);
                }}
                sx={{
                  padding: 1,
                  marginTop: 1,
                  width: "100%",
                }}
                color="secondary"
                variant="contained"
              >
                Add Individual ASIN to Market
              </Button> */}

              <Box sx={{ height: "800px", width: "100%", mt: 4 }}>
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
        </Box>
      </Box>
      <Backdrop
        open={openBackdrop}
        onClick={handleCloseBackdrop}
        sx={{ zIndex: 9999, color: "#fff" }}
      >
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

      {addAsinDialogOpen && (
        <Backdrop open={true} sx={{ zIndex: 9999, color: "#fff" }}>
          <Paper
            elevation={4}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              width: 400,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Product to Market
            </Typography>

            <Typography variant="body2" color="text.secondary">
              You can manually add a product by entering its valid ASIN. Our
              system will scrape the product data and include it in the selected
              market.
            </Typography>

            <input
              type="text"
              value={newAsin}
              onChange={(e) => {
                const value = e.target.value;
                setNewAsin(value);
                if (!isValidAsin(value)) {
                  setAsinError(
                    "ASIN must start with 'B' and be exactly 10 characters."
                  );
                } else {
                  setAsinError(null);
                }
              }}
              placeholder="Enter ASIN (e.g. B07N4M94ZP)"
              style={{
                padding: "10px",
                width: "100%",
                borderRadius: "6px",
                border: asinError ? "2px solid red" : "1px solid #ccc",
                fontSize: "16px",
              }}
              disabled={addingAsin}
            />

            {asinError && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: -1, mb: 1, textAlign: "left", width: "100%" }}
              >
                {asinError}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              ⏱️ This usually takes under 1 minute to complete.
            </Typography>

            {addingAsin ? (
              <Backdrop open={addingAsin} sx={{ zIndex: 1301, color: "#fff" }}>
                <CircularProgress color="inherit" />
              </Backdrop>
            ) : (
              <Box sx={{ display: "flex", gap: 2 }}>
                <button
                  disabled={!isValidAsin(newAsin) || addingAsin}
                  onClick={async () => {
                    if (!newAsin) return;
                    setAddingAsin(true);
                    const activeMarketId = marketCluster.markets[tabIndex].id;

                    const result = await MarketService.addAsinToMarket(
                      newAsin,
                      activeMarketId
                    );

                    if (result.success) {
                      let retries = 0;
                      const maxRetries = 15;
                      const pollForNewProduct = async () => {
                        retries += 1;
                        const updatedData =
                          await MarketService.getMarketClusterDetails(
                            Number(clusterId)
                          );
                        const targetMarket = updatedData.markets.find(
                          (m: any) => m.id === activeMarketId
                        );
                        const productFound = targetMarket?.products.find(
                          (p: any) => p.asin === newAsin.toUpperCase()
                        );

                        if (productFound) {
                          setMarketCluster(updatedData);
                          setAddAsinDialogOpen(false);
                          setAddingAsin(false);
                          setNewAsin(""); // ✅ reset field
                          showSnackbar(
                            "✅  Product successfully added to the market"
                          );
                        } else if (retries < maxRetries) {
                          setTimeout(pollForNewProduct, 4000);
                        } else {
                          setAddingAsin(false);
                          alert(
                            "⚠️ Product could not be confirmed after several attempts."
                          );
                        }
                      };

                      pollForNewProduct();
                    } else {
                      alert(result.message || "Something went wrong.");
                      setAddingAsin(false);
                    }
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: !isValidAsin(newAsin) ? "#ccc" : "#1976d2",
                    color: "white",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: !isValidAsin(newAsin) ? "not-allowed" : "pointer",
                  }}
                >
                  Confirm
                </button>

                <button
                  onClick={() => {
                    setAddAsinDialogOpen(false);
                    setNewAsin(""); // ✅ reset field
                  }}
                  disabled={addingAsin}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: addingAsin ? "#eee" : "#ccc",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </Box>
            )}
          </Paper>
        </Backdrop>
      )}
    </>
  );
}
