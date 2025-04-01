import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddAsinToMarketsDialog from "../components/details/AddAsinToMarketsDialog";
import ClusterInsights from "../components/details/ClusterInsights";
import MarketInsights from "../components/details/MarketInsights";
import ProductDataGrid from "../components/details/ProductDataGrid";
import ProductDetailTable from "../components/details/ProductDetailTable";
import TopSuggestions from "../components/details/TopSuggestions";
import PrimaryLineDivider from "../components/PrimaryLineDivider";
import { useSnackbar } from "../providers/SnackbarProvider";
import ChartDataService from "../services/ChartDataService";
import MarketService from "../services/MarketService";
import { fallbackIcon, iconMap } from "../utils/iconUtils";

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

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      
        <Box>
        <Button variant="outlined" component="a" href="/dashboard" sx={{ mb: 2, fontSize: "0.6rem" , color: theme.palette.text.primary }}>
        ← Back to Dashboard
      </Button>
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

              {/* Top Suggestions */}
              <TopSuggestions suggestions={market.top_suggestions} />

              <ProductDataGrid
                products={market.products}
                onShowDetails={handleShowDetails}
                onToggleMyProduct={toggleMyProduct}
                isInitialScraped={marketCluster.is_initial_scraped}
              />
            </Box>
          ))}
        </Box>
      </Box>
      <Backdrop
        open={openBackdrop}
        onClick={handleCloseBackdrop}
        sx={{ zIndex: 9999, color: "#fff" }}
      >
        <ProductDetailTable
          productChanges={productChanges}
          formatCurrency={formatCurrency}
        />
      </Backdrop>

      {addAsinDialogOpen && (
        <AddAsinToMarketsDialog
          open={addAsinDialogOpen}
          newAsin={newAsin}
          setNewAsin={setNewAsin}
          asinError={asinError}
          setAsinError={setAsinError}
          addingAsin={addingAsin}
          isValidAsin={isValidAsin}
          onConfirm={async () => {
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
                const updatedData = await MarketService.getMarketClusterDetails(
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
                  showSnackbar("✅  Product successfully added to the market");
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
          onCancel={() => {
            setAddAsinDialogOpen(false);
            setNewAsin(""); // ✅ reset field
          }}
        />
      )}
    </>
  );
}
