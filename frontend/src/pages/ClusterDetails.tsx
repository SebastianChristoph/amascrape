import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Link,
  Paper,
  styled,
  Tab,
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
import ChartDataService from "../services/ChartDataservice";
import MarketService from "../services/MarketService";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// function TabPanel(props: TabPanelProps) {
//   const { children, value, index, ...other } = props;

//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`tabpanel-${index}`}
//       aria-labelledby={`tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
//     </div>
//   );
// }

// function a11yProps(index: number) {
//   return {
//     id: `tab-${index}`,
//     "aria-controls": `tabpanel-${index}`,
//   };
// }

export default function ClusterDetails() {
  const { clusterId } = useParams(); // ID aus der URL abrufen
  const [marketCluster, setMarketCluster] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [stackedChartData, setStackedChartData] = useState<
    Record<string, { date: string; value: number }[]>
  >({});

  const [barChartData, setBarChartData] = useState<any[]>([]);

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

  // const Item = ({
  //   title,
  //   icon,
  //   children,
  // }: {
  //   title: string;
  //   icon: React.ReactNode;
  //   children: React.ReactNode;
  // }) => {
  //   return (
  //     <ItemCard sx={{ height: 400 }}>
  //       <CardHeader
  //         avatar={
  //           <Avatar
  //             sx={{
  //               bgcolor: "primary.main",
  //               color: "white",
  //               width: 40,
  //               height: 40,
  //             }}
  //           >
  //             {icon}
  //           </Avatar>
  //         }
  //         title={<Typography variant="body2">{title}</Typography>}
  //       />
  //       <CardContent sx={{ paddingBottom: 2,  display: "flex" , flexDirection:"row", alignItems:"flex-end"}}>{children}</CardContent>
  //     </ItemCard>
  //   );
  // };
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

  // 📌 Spalten für DataGrid mit Sparkline
  const columns: GridColDef[] = [
    {
      field: "image",
      headerName: "Image",
      width: 80,
      renderCell: (params) => (
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
      ),
    },
    {
      field: "id",
      headerName: "ASIN",
      width: 150,
      renderCell: (params) => (
        <Link
          href={`https://www.amazon.com/dp/${params.value}?language=en_US`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {params.value}
        </Link>
      ),
    },
    { field: "title", headerName: "Title", width: 400 },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 120,
      renderCell: (params) => formatCurrency(params.value), // ✅ Preis als $1,234.78 formatieren
    },
    {
      field: "chart",
      headerName: "Chart",
      width: 100,
      renderCell: (params) => {
        const [sparklineData, setSparklineData] = useState<number[] | null>(
          null
        );

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
          <CircularProgress size={20} />
        );
      },
    },
    { field: "mainCategory", headerName: "Main Category", width: 200 },
    {
      field: "mainCategoryRank",
      headerName: "Rank Main",
      width: 100,
      renderCell: (params) => formatNumber(params.value),
    },
    { field: "secondCategory", headerName: "Sub Category", width: 200 },
    {
      field: "secondCategoryRank",
      headerName: "Sub Rank",
      width: 100,
      renderCell: (params) => formatNumber(params.value),
    },
    {
      field: "blm",
      headerName: "Bought Last Month",
      type: "number",
      width: 130,
      renderCell: (params) => formatNumber(params.value), // ✅ BLM als 5,000 formatieren
    },
    {
      field: "total",
      headerName: "Total Revenue",
      type: "number",
      width: 150,
      renderCell: (params) => formatCurrency(params.value), // ✅ Total Revenue als $1,234.78 formatieren
    },
  ];

  return (
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
          <CustomStackBars data={stackedChartData} />{" "}
          {/* ✅ KORREKTES FORMAT */}
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

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          {marketCluster.markets.map((market: any, index: number) => (
            <Tab sx={{ fontSize: 22 }} key={index} label={market.keyword} />
          ))}
        </Tabs>
      </Box>

      {marketCluster.markets.map((market: any, index: number) => (
        <Box key={index} hidden={tabIndex !== index}>
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
  );
}
