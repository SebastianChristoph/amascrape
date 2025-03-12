import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarketService from "../services/MarketService";
import {
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Chip,
  styled,
  Paper,
  CardHeader,
  Avatar,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid2";
import CustomBarChart from "../components/charts/CustomBarChart";
import { GrBarChart } from "react-icons/gr";
import { TbListNumbers } from "react-icons/tb";
import { BiAbacus } from "react-icons/bi";
import CustomLineChart from "../components/charts/CustomLineChart";
import CustomStackBars from "../components/charts/CustomStackChart";
import CustomSparkLine from "../components/charts/CustomSparkLine";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    "aria-controls": `tabpanel-${index}`,
  };
}

export default function ClusterDetails() {
  const { clusterId } = useParams(); // ID aus der URL abrufen
  const [marketCluster, setMarketCluster] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabIndex, setTabIndex] = useState(0);

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

  const Item = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => {
    return (
      <ItemCard sx={{ minHeight: 500 }}>
        <CardHeader
          avatar={
            <Avatar
              sx={{
                bgcolor: "primary.main",
                color: "white",
                width: 40,
                height: 40,
              }}
            >
              {icon}
            </Avatar>
          }
          title={<Typography variant="body2">{title}</Typography>}
        />
        <CardContent>{children}</CardContent>
      </ItemCard>
    );
  };

  useEffect(() => {
    async function fetchClusterDetails() {
      if (!clusterId) return;
      setLoading(true);
      const data = await MarketService.getMarketClusterDetails(
        Number(clusterId)
      );
      console.log(data);
      setMarketCluster(data);
      setLoading(false);
    }

    fetchClusterDetails();
  }, [clusterId]);

  if (loading) return <CircularProgress />;
  if (
    !marketCluster ||
    !marketCluster.markets ||
    marketCluster.markets.length === 0
  )
    return (
      <Typography>
        Market-Cluster nicht gefunden oder keine Märkte enthalten.
      </Typography>
    );

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  // 📌 Spalten für DataGrid mit Bild hinzugefügt
  const columns: GridColDef[] = [
    {
      field: "image",
      headerName: "",
      width: 60,
      renderCell: (params) => {
        const imageUrl =
          !params.value || params.value === "no image"
            ? "https://i0.wp.com/sogiecenter.org/wp-content/uploads/2023/10/placeholder.png?fit=1200%2C800&ssl=1" // ✅ Platzhalter-Bild
            : params.value;

        return (
          <img
            src={imageUrl}
            alt="Product"
            style={{ width: "100%", objectFit: "fill", marginTop: 20 }}
          />
        );
      },
    },

    { field: "id", headerName: "ASIN", width: 150 },
    {
      field: "title",
      headerName: "Title",
      width: 400,
      renderCell: (params) =>
        params.value === null ? (
          <Alert sx={{ mt: 2 }} severity="info">
            {" "}
            Scraping needed
          </Alert>
        ) : (
          params.value
        ),
    },
    {
      field: "price",
      headerName: "Price $USD",
      type: "number",
      width: 100,
      renderCell: (params) =>
        params.value === null ? (
          <Alert sx={{ mt: 2 }} severity="info"></Alert>
        ) : (
          params.value
        ),
    },
    {
      field: "chart",
      headerName: "chart",
      width: 80,
      renderCell: () => {
        return <CustomSparkLine />;
      },
    },
    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 200,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
    },
    {
      field: "mainCategoryRank",
      headerName: "Rank Main",
      width: 100,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
    },
    {
      field: "secondCategory",
      headerName: "Sub Category",
      width: 200,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
    },
    {
      field: "secondCategoryRank",
      headerName: "Sub Rank",
      width: 100,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
    },
    {
      field: "blm",
      headerName: "Bought Last Month",
      width: 100,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
    },
    {
      field: "total",
      headerName: "Total Revenue",
      width: 200,
      renderCell: (params) =>
        params.value === null ? (
          <Chip label="no data" variant="outlined" size="small" />
        ) : (
          params.value
        ),
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
        {/* MARKET CLUSTER Chart */}
        <Grid size={{ md: 12, lg: 4 }}>
          <Item title="Last 30 days" icon={<GrBarChart />}>
            <CustomBarChart />
          </Item>
        </Grid>

        {/* MARKET CLUSTER KPIs */}
        <Grid size={{ md: 12, lg: 4 }}>
          <Item title="KPIs" icon={<TbListNumbers />}>
            Cool data
          </Item>
        </Grid>

        {/* MARKET CLUSTER Other Stuff */}
        <Grid size={{ md: 12, lg: 4 }}>
          <Item title="Other important stuff" icon={<BiAbacus />}>
            <CustomStackBars />
          </Item>
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

      <Paper sx={{ padding: 2, mb: 8 }}>
        Get your data for the markets here and add some cool text!
      </Paper>

      {/* Tabs für jeden Market */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          textColor="primary"
          indicatorColor="primary"
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Market Tabs"
        >
          {marketCluster.markets.map((market: any, index: number) => (
            <Tab key={index} label={market.keyword} {...a11yProps(index)} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Panels mit DataGrid für die neuesten Produkte */}

      {marketCluster.markets.map((market: any, index: number) => (
        <TabPanel key={index} value={tabIndex} index={index}>
          {/* GRID MARKETS */}
          <Grid container spacing={2}>
            {/* MARKET Alert */}
            <Grid size={{ md: 12, lg: 12 }}>
              <Box>
                <Alert severity="info">
                  This is just an impression of your market. It needs to be
                  scraped to get better data.
                </Alert>
              </Box>
            </Grid>

            {/* MARKET Chart */}
            <Grid size={{ md: 12, lg: 4 }}>
              <Item title="Last 30 days" icon={<GrBarChart />}>
                <CustomLineChart />
              </Item>
            </Grid>

            {/* MARKET KPIs */}
            <Grid size={{ md: 12, lg: 4 }}>
              <Item title="KPIs" icon={<TbListNumbers />}>
                <p>
                  Total revenue of market:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(market.revenue_total)}
                </p>
              </Item>
            </Grid>

            {/* MARKET Other Stuff */}
            <Grid size={{ md: 12, lg: 4 }}>
              <Item title="Other important stuff" icon={<BiAbacus />}>
                <Typography sx={{ mb: 2 }} variant="body2">
                  Other Stuff
                </Typography>
              </Item>
            </Grid>

            {/* MARKET TOP SUGGESTIONS */}
            <Grid size={{ md: 12, lg: 12 }}>
              <Box
                sx={{
                  backgroundColor: "#f5f5f5",
                  padding: 2,
                  borderRadius: 2,
                  mt: 2,
                  boxShadow: 1,
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  🔍 Top search term suggestions from Amazon Search Bar
                </Typography>

                {market.top_suggestions ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {market.top_suggestions
                      .split(",")
                      .map((suggestion: string, index: number) => (
                        <Chip
                          key={index}
                          label={suggestion.trim()}
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                  </Box>
                ) : (
                  <Typography sx={{ color: "gray", fontStyle: "italic" }}>
                    Keine Vorschläge verfügbar
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ width: "100%", marginTop: 2 }}>
            {market.products && market.products.length > 0 ? (
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
                }))}
                columns={columns}
                rowHeight={100}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 50,
                    },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
              />
            ) : (
              <Typography>
                Keine aktuellen Produktänderungen für diesen Markt.
              </Typography>
            )}
          </Box>
        </TabPanel>
      ))}
    </Paper>
  );
}
