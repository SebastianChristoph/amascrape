import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarketService from "../services/MarketService";
import { Typography, Container, CircularProgress, Box, Card, CardContent, Tabs, Tab } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

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
      setMarketCluster(data);
      setLoading(false);
    }

    fetchClusterDetails();
  }, [clusterId]);

  if (loading) return <CircularProgress />;
  if (!marketCluster) return <Typography>Market-Cluster nicht gefunden.</Typography>;

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ASIN", width: 150 },
    { field: "title", headerName: "Product Name", width: 250 },
    { field: "price", headerName: "Price (€)", type: "number", width: 120 },
    { field: "mainCategory", headerName: "Category", width: 180 },
  ];

  return (
    <Container>
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

          {/* Tab Panels mit DataGrid für die neuesten Produkte aus dem MarketChange */}
          {marketCluster.markets.map((market: any, index: number) => {
            const latestMarketChange = market.market_changes?.[0] || null;

            return (
              <TabPanel key={index} value={tabIndex} index={index}>
                <Box sx={{ height: 500, width: "100%", marginTop: 2 }}>
                  {latestMarketChange ? (
                    <DataGrid
                      rows={latestMarketChange.products.map((product: any) => ({
                        id: product.asin,
                        title: product.title,
                        price: product.price,
                        mainCategory: product.main_category || "N/A",
                      }))}
                      columns={columns}
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
            );
          })}
        </CardContent>
      </Card>
    </Container>
  );
}
