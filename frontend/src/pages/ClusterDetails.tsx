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
  Tooltip,
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
import { MdBookmarkAdd, MdBookmarkRemove } from "react-icons/md";
import ClusterInsights from "../components/details/ClusterInsights";
import MarketInsights from "../components/details/MarketInsights";

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
  const [userProducts, setUserProducts] = useState<any>(null);

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
        const [clusterData, stackedData, userProducts, myProducts] =
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

        if (userProducts) {
          console.log("[DEBUG] userProducts:", userProducts);

          setUserProducts(userProducts);
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
      setUserProducts(data);
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
        <Tooltip title="Get Product Insights">
          <IconButton
            onClick={() => handleShowDetails(params.row.id)}
            sx={{ padding: 0, color: "primary.main" }}
          >
            <FaRegEye size={20} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: "myProduct",
      headerName: "My Product",
      width: 50,
      renderCell: (params) => {
        return (
          <Box>
            <span
              onClick={() => toggleMyProduct(params.row.id)}
              style={{
                cursor: "pointer",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                color: params.row.isMyProduct
                  ? "theme.palette.accent.main"
                  : "theme.palette.primary.main",
                marginTop: 16,
              }}
            >
              {params.row.isMyProduct ? (
                <>
                  <Tooltip title="Remove from My Products">
                    <MdBookmarkRemove size={20} />
                  </Tooltip>
                </>
              ) : (
                <>
                  <Tooltip title="Add to My Products">
                    <MdBookmarkAdd size={20} />
                  </Tooltip>
                </>
              )}
            </span>
          </Box>
        );
      },
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
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
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
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
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
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
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
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
        );
      },
    },
    {
      field: "chart_total",
      headerName: "Total Trend",
      width: 100,
      renderCell: () => {
        return (
          <Box sx={{ mt: 0 }}>
            <CustomSparkLine />
          </Box>
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

  const allowedFields = ["details", "image", "asin", "title", "price"];

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
        <ClusterInsights
          stackedChartData={stackedChartData}
          marketCluster={marketCluster}
          userProducts={userProducts}
        />

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

          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 6 }}>
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
              <MarketInsights
                market={market}
                userProducts={userProducts}
                index={index}
              />

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

              <Box sx={{ width: "100%", mt: 4 }}>
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
                    isMyProduct: product.isMyProduct,
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
                          console.log(marketCluster);
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
