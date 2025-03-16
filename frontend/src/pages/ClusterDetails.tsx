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
import { FaRegEye } from "react-icons/fa";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


export default function ClusterDetails() {
  const { clusterId } = useParams(); // ID aus der URL abrufen
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
          .split("T")[0], // ✅ Korrigierte Umwandlung
        value: entry.value,
      }));
    });

    return transformedData;
  };

  useEffect(() => {
    async function fetchAllData() {
      if (!clusterId) return;

      setLoading(true); // 🔄 Ladezustand starten

      try {
        const [clusterData, stackedData, barData] = await Promise.all([
          MarketService.getMarketClusterDetails(Number(clusterId)),
          ChartDataService.GetStackedBarDataForCluster(Number(clusterId)), // ✅ NEUE ROUTE VERWENDEN
          ChartDataService.GetBarChartData(),
        ]);

        console.log("[DEBUG] API-Antwort für MarketCluster:", clusterData);
        console.log("[DEBUG] API-Antwort für Stacked Chart:", stackedData);
        console.log("[DEBUG] API-Antwort für Bar Chart:", barData);

        if (clusterData) setMarketCluster(clusterData);
        if (stackedData) {
          const transformedData = transformStackedChartData(stackedData); // 🔥 Korrekt umwandeln!
          setStackedChartData(transformedData);
        }
        if (barData) setBarChartData(barData.barChart);
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
      } finally {
        setLoading(false); // ✅ Ladezustand beenden
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
        <CircularProgress size={80} color="primary" /> {/* ⏳ Spinner */}
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

  // 📌 Spalten für DataGrid mit Sparkline
  const columns: GridColDef[] = [
    {
      field: "details",
      headerName: "Details",
      width: 30,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleShowDetails(params.row.id)}
          sx={{ padding: 0, color: "primary.main" }} // Keine extra Padding, nur Icon klickbar
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
  
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          {marketCluster.title}
        </Typography>
  
        {/* GRID MARKET CLUSTER */}
        <Grid container spacing={2}>
          <Grid size={{ sm: 12, lg: 4 }}>
            <CustomStackBars data={stackedChartData} />
          </Grid>
          <Grid size={{ sm: 12, lg: 4 }}>
            <Typography variant="h3">
              Total Revenue:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(marketCluster.total_revenue)}
             
            </Typography>
          </Grid>
          <Grid size={{ sm: 12, lg: 4 }}>
            <CustomBarChart data={barChartData} />
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
  
        {/* ✅ Tabs für die verschiedenen Märkte */}
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
  
        {/* ✅ Tab-Inhalte (nur aktives DataGrid anzeigen) */}
        {marketCluster.markets.map((market: any, index: number) => (
          <>
            <Paper
      elevation={3}
      sx={{
        p: 2,
        my: 2,
        backgroundColor: "#f5f5f5",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
        🔍 Top Suggestions
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {market.top_suggestions.split(",").map((suggestion: string, idx: number) => (
          <Chip key={idx} label={suggestion.trim()} variant="outlined" color="primary" />
        ))}
      </Box>
    </Paper>
          <Box
            key={market.id}
            sx={{
              minHeight: 500,
              width: "100%",
              mt: 3,
              display: tabIndex === index ? "block" : "none", // ✅ Nur aktiven Tab anzeigen
            }}
          >
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
            </>
        ))}
      </Paper>
  
      {/* ✅ Backdrop für Product Changes (außerhalb der `.map()`-Schleife) */}
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
