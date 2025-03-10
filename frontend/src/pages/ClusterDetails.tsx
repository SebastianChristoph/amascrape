import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarketService from "../services/MarketService";
import { Typography, Container, CircularProgress, Box, Card, CardContent, Tabs, Tab } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import LinearProgress from '@mui/material/LinearProgress';


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

  useEffect(() => {
    async function fetchClusterDetails() {
      if (!clusterId) return;
      setLoading(true);
      const data = await MarketService.get_market_cluster_details(Number(clusterId));
      console.log(data);
      setMarketCluster(data);
      setLoading(false);
    }

    fetchClusterDetails();
  }, [clusterId]);

  if (loading) return <CircularProgress />;
  if (!marketCluster || !marketCluster.markets || marketCluster.markets.length === 0)
    return <Typography>Market-Cluster nicht gefunden oder keine Märkte enthalten.</Typography>;

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  // 📌 Spalten für DataGrid mit Bild hinzugefügt
  const columns: GridColDef[] = [
    {
      field: "image",
      headerName: "Image",
      width: 80,
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
      headerName: "Titel",
      width: 120,
      renderCell: (params) =>
        params.value === "Kein Titel" ? <CircularProgress size={20} /> : params.value,
    },
    {
      field: "price",
      headerName: "Preis (€)",
      type: "number",
      width: 120,
      renderCell: (params) =>
        params.value === -1 || params.value === "N/A" ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "mainCategory",
      headerName: "Main Category",
      width: 180,
      renderCell: (params) =>
        params.value === "Unknown" ? <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "mainCategoryRank",
      headerName: "Rank #1",
      width: 180,
      renderCell: (params) =>
        params.value === -1 ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "secondCategory",
      headerName: "Category #2",
      width: 180,
      renderCell: (params) =>
        params.value === "Unknown" ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "secondCategoryRank",
      headerName: "Rank #2",
      width: 180,
      renderCell: (params) =>
        params.value === -1 ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "blm",
      headerName: "BLM",
      width: 180,
      renderCell: (params) =>
        params.value === -1 ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
    {
      field: "total",
      headerName: "Total",
      width: 180,
      renderCell: (params) =>
        params.value === 0.0 || params.value === "N/A" ?  <Box sx={{mt:5}}><LinearProgress /></Box> : params.value,
    },
  ];
  
  return (
    <div>
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        {marketCluster.title}
      </Typography>

      <Card sx={{ marginBottom: 2 }}>
        <CardContent>
          <Typography variant="h5">Märkte</Typography>

          {/* Tabs für jeden Market */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Market Tabs">
              {marketCluster.markets.map((market: any, index: number) => (
                <Tab key={index} label={market.keyword} {...a11yProps(index)} />
              ))}
            </Tabs>
          </Box>

          {/* Tab Panels mit DataGrid für die neuesten Produkte */}
          {marketCluster.markets.map((market: any, index: number) => (
            <TabPanel key={index} value={tabIndex} index={index}>
              <p>
                Total revenue of market: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(market.revenue_total)}
              </p>

              <div>
                <h3>Top suggestions for market:</h3>
                {market.top_suggestions
                  ? market.top_suggestions.split(",").map((suggestion: string, index: number) => (
                      <p key={index}>{suggestion.trim()}</p>
                    ))
                  : <p>No suggestions available</p>
                }
              </div>

              <Box sx={{ width: "100%", marginTop: 2 }}>
                {market.products && market.products.length > 0 ? (
                  <DataGrid
                    rows={market.products.map((product: any) => ({
                      id: product.asin,
                      image: product.image, 
                      title: product.title || "Kein Titel",
                      price: product.price || "N/A",
                      mainCategory: product.main_category || "N/A",
                      mainCategoryRank: product.main_category_rank || "N/A",
                      secondCategory: product.second_category || "N/A",
                      secondCategoryRank: product.second_category_rank || "N/A",
                      blm: product.blm || "N/A",
                      total: product.total || "N/A",
                    }))}
                    columns={columns}
                    rowHeight={100}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    checkboxSelection
                    disableRowSelectionOnClick
                  />
                ) : (
                  <Typography>Keine aktuellen Produktänderungen für diesen Markt.</Typography>
                )}
              </Box>
            </TabPanel>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
