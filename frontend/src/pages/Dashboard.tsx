import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { GrCluster } from "react-icons/gr";
import { MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ClusterCard from "../components/ClusterCard";
import { useSnackbar } from "../providers/SnackbarProvider";
import MarketService from "../services/MarketService";

interface DashboardProps {
  newClusterData: {
    keywords: string[];
    clusterName: string | null;
    loadingScrapingData: boolean;
    scrapingData: any;
  };
  setNewClusterData: React.Dispatch<
    React.SetStateAction<{
      keywords: string[];
      clusterName: string | null;
      loadingScrapingData: boolean;
      scrapingData: any;
    }>
  >;
}

const Dashboard: React.FC<DashboardProps> = ({
  newClusterData,
  setNewClusterData,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [activeClusters, setActiveClusters] = useState<string[]>([]);

  // ✅ Holt alle Market-Cluster des Users
  const fetchMarketClusters = async () => {
    const data = await MarketService.get_market_cluster();
    if (data) {
      setMarketClusters(data);
    } else {
      showSnackbar("Fehler beim Laden der Market-Cluster.");
    }
  };

  // ✅ Startet das Polling für einen Cluster
  const startCheckingScrapingProcess = async (clustername: string) => {
    let isDone = false;

    const checkStatus = async () => {
      const data = await MarketService.checkScrapingProcessStatus(clustername);
      console.log(`🔍 Status für ${clustername}:`, data);

      setNewClusterData((prevState) => ({
        ...prevState,
        scrapingData: { ...data, title: clustername },
      }));

      if (data.status === "done") {
        isDone = true;
        setNewClusterData((prevState) => ({
          ...prevState,
          loadingScrapingData: false,
          keywords: [],
          clusterName: null,
          scrapingData: null,
        }));
        fetchMarketClusters(); // ✅ Cluster-Liste aktualisieren
      }
    };

    await checkStatus();
    if (isDone) return;

    const interval = setInterval(async () => {
      await checkStatus();
      if (isDone) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  };

  // ✅ Prüft beim Laden, ob aktive Scraping-Prozesse laufen
  useEffect(() => {
    const checkActiveScraping = async () => {
      const active = await MarketService.getActiveScrapingClusters();
      console.log("🔍 Aktive Scraping-Prozesse:", active);

      setActiveClusters(active);
      setNewClusterData((prevState) => ({
        ...prevState,
        loadingScrapingData: true,
      }));

      // Starte das Polling für alle aktiven Cluster
      active.forEach((cluster) => startCheckingScrapingProcess(cluster));
    };

    checkActiveScraping();
  }, []);

  // ✅ Holt die Market-Cluster beim Laden
  useEffect(() => {
    fetchMarketClusters();
  }, []);

  return (
    <Container maxWidth="xl">
      {/* ✅ Zeigt aktiven Scraping-Prozess an */}
      {activeClusters.length > 0 && (
        <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2, borderRadius: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Card elevation={5} sx={{ cursor: "pointer", borderRadius: 3 }}>
                <CardHeader
                  sx={{ alignItems: "flex-start" }}
                  avatar={<GrCluster size={28} color="#000010" />}
                  title={
                    <Typography
                      variant="h6"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <CircularProgress size={24} sx={{ color: "primary.main" }} />
                      Aktive Scraping-Prozesse laufen...
                    </Typography>
                  }
                />
                <CardContent sx={{ minHeight: 200 }}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1">Scraping für folgende Cluster:</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {activeClusters.map((cluster) => (
                        <Box
                          key={cluster}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <CircularProgress size={16} sx={{ color: "primary.main" }} />
                          <Typography variant="body2">{cluster}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* ✅ Zeigt alle Market-Cluster an */}
      <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          My Market Clusters
        </Typography>

        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={3}>
            {marketClusters.map((cluster) => (
              <Grid key={cluster.id} size={4}>
                <ClusterCard
                  cluster={cluster}
                  onClick={() => navigate(`/cluster/${cluster.id}`)}
                  deletingCluster={deletingCluster}
                  setMarketClusters={setMarketClusters}
                  setDeletingCluster={setDeletingCluster}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ✅ Button ist deaktiviert, wenn Scraping läuft */}
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          startIcon={<MdAdd />}
          onClick={() => navigate("/add-market-cluster")}
          disabled={activeClusters.length > 0}
        >
          Add Market Cluster
        </Button>
      </Paper>
    </Container>
  );
};

export default Dashboard;
