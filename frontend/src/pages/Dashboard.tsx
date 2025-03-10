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
import { AiOutlineCheckCircle } from "react-icons/ai";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [marketClusters, setMarketClusters] = useState<any[]>([]);
  const [deletingCluster, setDeletingCluster] = useState<number | null>(null);
  const [activeClusters, setActiveClusters] = useState<
    { cluster_name: string; keywords: { [key: string]: { status: string } } }[]
  >([]);

  // ✅ Filtert nur Cluster mit mindestens einem "processing" Keyword
  const runningScrapingClusters = activeClusters.filter((cluster) =>
    cluster.keywords && Object.values(cluster.keywords).some((kw) => kw.status !== "done")
  );

  // ✅ Holt alle Market-Cluster des Users
  const fetchMarketClusters = async () => {
    try {
      const data = await MarketService.get_market_cluster();
      if (data) {
        setMarketClusters(data);
      } else {
        showSnackbar("Fehler beim Laden der Market-Cluster.");
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Market-Cluster:", error);
      showSnackbar("Fehler beim Abrufen der Market-Cluster.");
    }
  };

  const startCheckingScrapingProcess = async (clustername: string | undefined) => {
    if (!clustername) {
      console.error("❌ Fehler: `clustername` ist undefined!");
      return;
    }

    let isDone = false;

    const checkStatus = async () => {
      const data = await MarketService.checkScrapingProcessStatus(clustername);
      console.log(`🔍 Status für ${clustername}:`, data);

      if (!data.keywords || typeof data.keywords !== "object") {
        console.error(`❌ Fehler: Keine Keywords in Cluster ${clustername}`);
        return;
      }

      const allKeywordsDone = Object.values(data.keywords).every((kwData) => kwData.status === "done");

      if (allKeywordsDone) {
        isDone = true;
        setActiveClusters((prevClusters) => prevClusters.filter((c) => c.cluster_name !== clustername));
        fetchMarketClusters();
      }
    };

    await checkStatus();
    if (isDone) return;

    const interval = setInterval(async () => {
      await checkStatus();
      if (isDone) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  // ✅ Holt aktive Scraping-Prozesse und lädt die Keywords nach
  const fetchActiveScrapingClusters = async () => {
    try {
      const active = await MarketService.getActiveScrapingClusters();
      console.log("🔍 Aktive Scraping-Prozesse:", active);

      // **Alle Cluster mit Status holen**
      const clustersWithKeywords = await Promise.all(
        active.map(async (cluster) => {
          const statusData = await MarketService.checkScrapingProcessStatus(cluster.cluster_name);

          if (!statusData.keywords) {
            console.warn(`⚠️ Keine Keywords für Cluster ${cluster.cluster_name}`, statusData);
            return { ...cluster, keywords: {} };
          }

          return { ...cluster, keywords: statusData.keywords };
        })
      );

      setActiveClusters(clustersWithKeywords);
      console.log("✅ Aktualisierte activeClusters:", clustersWithKeywords);

      // Starte das Polling für jedes aktive Cluster
      clustersWithKeywords.forEach((cluster) => startCheckingScrapingProcess(cluster.cluster_name));
    } catch (error) {
      console.error("Fehler beim Abrufen aktiver Scraping-Prozesse:", error);
    }
  };

  // ✅ Holt die Market-Cluster beim Laden
  useEffect(() => {
    fetchMarketClusters();
  }, []);

  // ✅ Prüft auf aktive Scraping-Prozesse
  useEffect(() => {
    fetchActiveScrapingClusters();
  }, []);

  return (
    <Container maxWidth="xl">
      {/* ✅ Zeigt aktive Scraping-Prozesse mit Keywords & Status an */}
      {runningScrapingClusters.length > 0 && (
        <Paper sx={{ paddingY: 4, paddingX: 4, mt: 2, borderRadius: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={3}>
              <Card elevation={5} sx={{ cursor: "pointer", borderRadius: 3 }}>
                <CardHeader
                  sx={{ alignItems: "flex-start" }}
                  avatar={<GrCluster size={28} color="#000010" />}
                  title={
                    <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={24} sx={{ color: "primary.main" }} />
                      Aktive Scraping-Prozesse laufen...
                    </Typography>
                  }
                />
                <CardContent sx={{ minHeight: 200 }}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body1">Scraping für folgende Cluster:</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {runningScrapingClusters.map((cluster) => (
                        <Box key={cluster.cluster_name} sx={{ mb: 2 }}>
                          <Typography variant="h6">{cluster.cluster_name}</Typography>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {Object.entries(cluster.keywords).map(([keyword, kwData]) => (
                              <Box key={keyword} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {/* ✅ Zeigt grünen Haken für "done" Keywords, sonst Spinner */}
                                {kwData.status === "done" ? (
                                  <AiOutlineCheckCircle size={18} color="green" />
                                ) : (
                                  <CircularProgress size={16} sx={{ color: "primary.main" }} />
                                )}
                                <Typography variant="body2">{keyword}</Typography>
                              </Box>
                            ))}
                          </Box>
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
